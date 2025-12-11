package proxy

import (
	"net/http"
)

type RouteHandler struct {
	proxy *ReverseProxy
}

func NewRouteHandler(proxy *ReverseProxy) *RouteHandler {
	return &RouteHandler{
		proxy: proxy,
	}
}

func (rh *RouteHandler) Handle(w http.ResponseWriter, r *http.Request) {
	rh.proxy.ServeHTTP(w, r)
}