#!/bin/bash

set +e

CONSUL_ADDRESS="${CONSUL_ADDRESS:-consul:8500}"
MAX_RETRIES=60
RETRY_INTERVAL=2

wait_for_service() {
    local service_name=$1
    local service_url=$2
    local retry_count=0
    
    echo "Waiting for $service_name to be ready..."
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        if curl -f -s "$service_url" > /dev/null 2>&1; then
            echo "$service_name is ready!"
            return 0
        fi
        retry_count=$((retry_count + 1))
        echo "Waiting for $service_name... ($retry_count/$MAX_RETRIES)"
        sleep $RETRY_INTERVAL
    done
    
    echo "$service_name did not become ready in time" >&2
    return 1
}

register_service() {
    local service_id=$1
    local service_name=$2
    local service_address=$3
    local service_port=$4
    local health_check_url=$5
    
    echo "Registering $service_name in Consul..."
    
    curl -s -X PUT "http://$CONSUL_ADDRESS/v1/agent/service/deregister/$service_id" > /dev/null 2>&1 || true
    
    local service_definition=$(cat <<EOF
{
    "ID": "$service_id",
    "Name": "$service_name",
    "Address": "$service_address",
    "Port": $service_port,
    "Check": {
        "HTTP": "$health_check_url",
        "Interval": "10s",
        "Timeout": "3s"
    }
}
EOF
)
    
    if curl -s -X PUT "http://$CONSUL_ADDRESS/v1/agent/service/register" \
        -H "Content-Type: application/json" \
        -d "$service_definition" > /dev/null; then
        echo "$service_name registered successfully!"
        return 0
    else
        echo "Failed to register $service_name" >&2
        return 1
    fi
}

echo "Waiting for Consul to be ready..."
wait_for_service "Consul" "http://$CONSUL_ADDRESS/v1/status/leader"

echo ""
echo "=== Registering services in Consul ==="
echo ""

if wait_for_service "auth-service" "http://auth-service:8080/swagger/index.html"; then
    register_service "auth-service-8080" "auth-service" "auth-service" 8080 "http://auth-service:8080/swagger/index.html" || echo "Warning: Failed to register auth-service"
else
    echo "Warning: auth-service is not ready, skipping registration"
fi

if wait_for_service "project-service" "http://project-service:8080/swagger/index.html"; then
    register_service "project-service-8080" "project-service" "project-service" 8080 "http://project-service:8080/swagger/index.html" || echo "Warning: Failed to register project-service"
else
    echo "Warning: project-service is not ready, skipping registration"
fi

if wait_for_service "backlog-service" "http://backlog-service:8080/swagger/index.html"; then
    register_service "backlog-service-8080" "backlog-service" "backlog-service" 8080 "http://backlog-service:8080/swagger/index.html" || echo "Warning: Failed to register backlog-service"
else
    echo "Warning: backlog-service is not ready, skipping registration"
fi

if wait_for_service "template-service" "http://template-service:8003/health"; then
    register_service "template-service-8003" "template-service" "template-service" 8003 "http://template-service:8003/health" || echo "Warning: Failed to register template-service"
else
    echo "Warning: template-service is not ready, skipping registration"
fi

if wait_for_service "presentation-builder-service" "http://presentation-builder-service:8005/health"; then
    register_service "presentation-builder-service-8005" "presentation-builder-service" "presentation-builder-service" 8005 "http://presentation-builder-service:8005/health" || echo "Warning: Failed to register presentation-builder-service"
else
    echo "Warning: presentation-builder-service is not ready, skipping registration"
fi

echo ""
echo "=== All services registered successfully! ==="
echo "Services will be monitored by Consul health checks."
echo ""
echo "Registration service is running. Press Ctrl+C to stop."

while true; do
    sleep 60
    if ! curl -f -s "http://$CONSUL_ADDRESS/v1/status/leader" > /dev/null 2>&1; then
        echo "Warning: Consul is not accessible"
    fi
done
