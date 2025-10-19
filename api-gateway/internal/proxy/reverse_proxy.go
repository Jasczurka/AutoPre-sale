package proxy

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

// NewSingleHostProxy creates proxy for a target base URL
func NewSingleHostProxy(target string) (*httputil.ReverseProxy, error) {
	if !strings.HasPrefix(target, "http") {
		target = "http://" + target
	}
	u, err := url.Parse(target)
	if err != nil {
		return nil, err
	}
	proxy := httputil.NewSingleHostReverseProxy(u)
	// preserve host header
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		// optional: preserve original Host header or pass through
		req.Host = u.Host
	}
	proxy.ErrorHandler = func(rw http.ResponseWriter, req *http.Request, err error) {
		log.Printf("proxy error to %s: %v", target, err)
		http.Error(rw, "upstream error", http.StatusBadGateway)
	}
	return proxy, nil
}
