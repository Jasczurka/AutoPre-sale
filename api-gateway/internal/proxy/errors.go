package proxy

import (
	"encoding/json"
	"net/http"
)

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}

func WriteError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	
	response := ErrorResponse{
		Error:   http.StatusText(code),
		Message: message,
		Code:    code,
	}
	
	json.NewEncoder(w).Encode(response)
}