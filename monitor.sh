#!/bin/bash

# PROgress Tracker - Health Check Monitor
# This script monitors the health of deployed services

set -e

# Configuration
BACKEND_URL=${1:-"http://localhost:8080"}
FRONTEND_URL=${2:-"http://localhost:3000"}
CHECK_INTERVAL=${3:-30}
LOG_FILE="health-monitor.log"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check service health
check_health() {
    local url=$1
    local service=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url/health" || echo "000")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓${NC} $service is healthy"
        return 0
    else
        echo -e "${RED}✗${NC} $service is unhealthy (HTTP $response)"
        return 1
    fi
}

# Function to check readiness
check_readiness() {
    local url=$1
    local service=$2
    
    response=$(curl -s "$url/readiness" 2>/dev/null || echo "{}")
    status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$status" = "ready" ] || [ "$status" = "degraded" ]; then
        echo -e "${GREEN}✓${NC} $service is ready (status: $status)"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $service is not ready (status: $status)"
        return 1
    fi
}

# Function to get metrics
get_metrics() {
    local url=$1
    
    metrics=$(curl -s "$url/metrics" 2>/dev/null || echo "")
    
    if [ -n "$metrics" ]; then
        echo "$metrics" | grep -E "process_uptime_seconds|process_memory_heap_used_bytes" || true
    fi
}

# Function to check BigQuery connectivity
check_bigquery() {
    local url=$1
    
    response=$(curl -s "$url/status" 2>/dev/null || echo "{}")
    bq_status=$(echo "$response" | grep -o '"bigquery":{[^}]*}' | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$bq_status" = "connected" ]; then
        echo -e "${GREEN}✓${NC} BigQuery is connected"
        return 0
    else
        echo -e "${RED}✗${NC} BigQuery is disconnected"
        return 1
    fi
}

# Function to send alert (customize based on your alerting system)
send_alert() {
    local service=$1
    local message=$2
    
    log_message "ALERT: $service - $message"
    
    # Example: Send to Slack webhook
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"🚨 Progress Tracker Alert: $service - $message\"}" \
    #     "$SLACK_WEBHOOK_URL"
    
    # Example: Send email
    # echo "$message" | mail -s "Progress Tracker Alert: $service" admin@example.com
}

# Main monitoring loop
main() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}PROgress Tracker Health Monitor${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo "Backend URL: $BACKEND_URL"
    echo "Frontend URL: $FRONTEND_URL"
    echo "Check interval: ${CHECK_INTERVAL}s"
    echo ""
    
    log_message "Health monitor started"
    
    consecutive_failures=0
    max_failures=3
    
    while true; do
        echo -e "\n[$(date '+%Y-%m-%d %H:%M:%S')] Running health checks..."
        echo "----------------------------------------"
        
        all_healthy=true
        
        # Check backend health
        if ! check_health "$BACKEND_URL" "Backend"; then
            all_healthy=false
            consecutive_failures=$((consecutive_failures + 1))
        else
            consecutive_failures=0
        fi
        
        # Check backend readiness
        check_readiness "$BACKEND_URL" "Backend"
        
        # Check BigQuery
        check_bigquery "$BACKEND_URL"
        
        # Check frontend (if not localhost)
        if [[ ! "$FRONTEND_URL" =~ "localhost" ]]; then
            if ! check_health "$FRONTEND_URL" "Frontend"; then
                all_healthy=false
            fi
        fi
        
        # Get metrics
        echo -e "\n${YELLOW}Metrics:${NC}"
        get_metrics "$BACKEND_URL"
        
        # Send alert if consecutive failures exceed threshold
        if [ $consecutive_failures -ge $max_failures ]; then
            send_alert "Backend" "Service has been down for $consecutive_failures consecutive checks"
            consecutive_failures=0  # Reset to avoid spam
        fi
        
        # Status summary
        echo "----------------------------------------"
        if [ "$all_healthy" = true ]; then
            echo -e "${GREEN}All services are healthy ✓${NC}"
        else
            echo -e "${RED}Some services are experiencing issues ✗${NC}"
        fi
        
        # Sleep before next check
        sleep "$CHECK_INTERVAL"
    done
}

# Handle script termination
trap 'echo -e "\n${YELLOW}Health monitor stopped${NC}"; log_message "Health monitor stopped"; exit 0' INT TERM

# Run main function
main
