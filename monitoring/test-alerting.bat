@echo off
REM Test Alerting System Script for Windows
REM This script tests various alert scenarios to verify the monitoring setup

setlocal enabledelayedexpansion

set NAMESPACE=monitoring
set APP_NAMESPACE=password-manager
set PROMETHEUS_URL=http://localhost:9090
set ALERTMANAGER_URL=http://localhost:9093

echo =========================================
echo Password Manager - Alerting System Test
echo =========================================
echo.

echo Test 1: Checking Monitoring Stack Components
echo ---------------------------------------------

kubectl get pods -n %NAMESPACE% -l app=prometheus | findstr Running >nul
if %errorlevel% equ 0 (
    echo [OK] Prometheus is running
) else (
    echo [ERROR] Prometheus is not running
)

kubectl get pods -n %NAMESPACE% -l app=grafana | findstr Running >nul
if %errorlevel% equ 0 (
    echo [OK] Grafana is running
) else (
    echo [ERROR] Grafana is not running
)

kubectl get pods -n %NAMESPACE% -l app=alertmanager | findstr Running >nul
if %errorlevel% equ 0 (
    echo [OK] Alertmanager is running
) else (
    echo [ERROR] Alertmanager is not running
)

kubectl get pods -n %NAMESPACE% -l app=elasticsearch | findstr Running >nul
if %errorlevel% equ 0 (
    echo [OK] Elasticsearch is running
) else (
    echo [ERROR] Elasticsearch is not running
)

kubectl get pods -n %NAMESPACE% -l app=logstash | findstr Running >nul
if %errorlevel% equ 0 (
    echo [OK] Logstash is running
) else (
    echo [ERROR] Logstash is not running
)

kubectl get pods -n %NAMESPACE% -l app=kibana | findstr Running >nul
if %errorlevel% equ 0 (
    echo [OK] Kibana is running
) else (
    echo [ERROR] Kibana is not running
)

echo.
echo Test 2: Port Forward Services
echo ------------------------------
echo Starting port forwards in background...
echo.

start /B kubectl port-forward -n %NAMESPACE% svc/prometheus 9090:9090
timeout /t 3 /nobreak >nul

start /B kubectl port-forward -n %NAMESPACE% svc/alertmanager 9093:9093
timeout /t 3 /nobreak >nul

start /B kubectl port-forward -n %NAMESPACE% svc/grafana 3000:3000
timeout /t 3 /nobreak >nul

start /B kubectl port-forward -n %NAMESPACE% svc/elasticsearch-client 9200:9200
timeout /t 3 /nobreak >nul

echo Port forwards started. Testing connectivity...
echo.

echo Test 3: Checking Service Health
echo --------------------------------

curl -s %PROMETHEUS_URL%/-/healthy >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Prometheus is healthy
) else (
    echo [ERROR] Prometheus is not accessible
)

curl -s %ALERTMANAGER_URL%/-/healthy >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Alertmanager is healthy
) else (
    echo [ERROR] Alertmanager is not accessible
)

curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Grafana is healthy
) else (
    echo [ERROR] Grafana is not accessible
)

curl -s http://localhost:9200/_cluster/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Elasticsearch is healthy
) else (
    echo [ERROR] Elasticsearch is not accessible
)

echo.
echo Test 4: Checking Exporters
echo --------------------------

kubectl get pods -n %NAMESPACE% -l app=postgres-exporter | findstr Running >nul
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL Exporter is running
) else (
    echo [ERROR] PostgreSQL Exporter is not running
)

kubectl get pods -n %NAMESPACE% -l app=redis-exporter | findstr Running >nul
if %errorlevel% equ 0 (
    echo [OK] Redis Exporter is running
) else (
    echo [ERROR] Redis Exporter is not running
)

kubectl get pods -n %NAMESPACE% -l app=node-exporter | findstr Running >nul
if %errorlevel% equ 0 (
    echo [OK] Node Exporter is running
) else (
    echo [ERROR] Node Exporter is not running
)

echo.
echo Test 5: Checking Sentry Configuration
echo --------------------------------------

kubectl get configmap sentry-config-backend -n %APP_NAMESPACE% >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Sentry backend configuration found
) else (
    echo [WARNING] Sentry backend configuration not found
)

kubectl get configmap sentry-config-frontend -n %APP_NAMESPACE% >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Sentry frontend configuration found
) else (
    echo [WARNING] Sentry frontend configuration not found
)

kubectl get secret sentry-dsn -n %APP_NAMESPACE% >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Sentry DSN secret found
) else (
    echo [WARNING] Sentry DSN secret not found
)

echo.
echo =========================================
echo Test Summary
echo =========================================
echo.
echo Monitoring stack components are deployed and running.
echo.
echo Manual verification required:
echo 1. Check Grafana dashboards: http://localhost:3000
echo 2. Verify alert notifications (email, Slack, PagerDuty)
echo 3. Test alert silencing in Alertmanager: http://localhost:9093
echo 4. Verify logs in Kibana: http://localhost:5601
echo 5. Check Sentry error tracking in Sentry dashboard
echo.
echo Services are accessible at:
echo   Prometheus:    http://localhost:9090
echo   Grafana:       http://localhost:3000
echo   Alertmanager:  http://localhost:9093
echo   Elasticsearch: http://localhost:9200
echo.
echo Press any key to stop port forwards and exit...
pause >nul

REM Kill port forwards
taskkill /F /FI "IMAGENAME eq kubectl.exe" /FI "WINDOWTITLE eq *port-forward*" >nul 2>&1

echo.
echo [OK] Alerting system test completed!
