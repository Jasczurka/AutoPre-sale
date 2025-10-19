package router

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/Jasczurka/AutoPre-sale/api-gateway/internal/config"
	"github.com/Jasczurka/AutoPre-sale/api-gateway/internal/middleware"
	"github.com/Jasczurka/AutoPre-sale/api-gateway/internal/proxy"
	"github.com/Jasczurka/AutoPre-sale/api-gateway/internal/registry"
)

func NewMux(cfg *config.Config, reg *registry.ConsulRegistry) (http.Handler, error) {
	mux := http.NewServeMux()

	// health
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	// register routes from config
	for _, rt := range cfg.Routes {
		route := rt // copy for closure
		var handler http.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// resolve upstream by service name
			upstream, err := reg.GetServiceAddress(route.ServiceName)
			if err != nil {
				http.Error(w, "service unavailable", http.StatusServiceUnavailable)
				return
			}
			suffix := "/"
			if len(route.PathPrefix) > 0 {
				suffix = strings.TrimPrefix(r.URL.Path, strings.TrimRight(route.PathPrefix, "/"))
				if !strings.HasPrefix(suffix, "/") {
					suffix = "/" + suffix
				}
			}
			target := fmt.Sprintf("%s%s", upstream, suffix)
			p, err := proxy.NewSingleHostProxy(target)
			if err != nil {
				http.Error(w, "proxy init error", http.StatusInternalServerError)
				return
			}
			p.ServeHTTP(w, r)
		})

		// wrap middleware
		if route.AuthRequired {
			handler = middleware.JWTAuthMiddleware(cfg.Server.JWTSecret)(handler)
		}
		handler = middleware.Recovery(handler)
		handler = middleware.CORS(handler)
		handler = middleware.Logging(handler)

		// ensure prefix ends with slash for mux
		prefix := strings.TrimRight(route.PathPrefix, "/") + "/"
		mux.Handle(prefix, http.StripPrefix(strings.TrimRight(route.PathPrefix, "/"), handler))
		// also mount exact prefix without trailing slash
		mux.Handle(route.PathPrefix, handler)
	}

	return mux, nil
}
