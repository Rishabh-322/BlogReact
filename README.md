# Marginal — Blog App on EKS (CI/CD Reference Project)

A production-style 3-tier blog application — **React frontend, Node.js/Express backend,
MySQL database** — deployed to **Amazon EKS** through a Jenkins pipeline that runs
**SonarQube** (code quality), **Nexus** (artifact storage), **Trivy** (container scanning),
and ships with **Prometheus/Grafana** monitoring hooks.

## Architecture

```
                         ┌────────────────────────┐
 Browser ── HTTPS ──▶    │   ALB Ingress (EKS)     │
                         └───────────┬─────────────┘
                     ┌───────────────┴───────────────┐
                     ▼                                ▼
          ┌─────────────────────┐          ┌─────────────────────┐
          │ frontend-service     │  /api → │ backend-service      │
          │ (nginx + React SPA)  │────────▶│ (Node/Express API)   │
          │ 3+ pods, HPA         │          │ 3+ pods, HPA          │
          └─────────────────────┘          └──────────┬───────────┘
                                                        ▼
                                            ┌─────────────────────┐
                                            │ mysql StatefulSet    │
                                            │ + EBS gp3 volume     │
                                            └─────────────────────┘

CI/CD:  Git push → Jenkins → npm test → SonarQube gate → Nexus (artifact) →
        docker build → Trivy scan (fails on CRITICAL/HIGH) → push to ECR →
        kubectl apply -k (EKS) → rollout status → smoke test

Monitoring: Prometheus Operator scrapes backend /metrics via ServiceMonitor,
            PrometheusRule alerts on 5xx rate / crash loops / DB down,
            Grafana dashboards on top (bring your own kube-prometheus-stack).
```

## Repository layout

```
blog-app-eks/
├── frontend/            React (Vite) SPA, nginx-unprivileged Docker image
├── backend/              Express REST API, MySQL client, JWT auth, Prometheus metrics
├── database/init.sql     Schema + seed data (users, posts, comments)
├── k8s/
│   ├── base/              Namespace, gp3 StorageClass
│   ├── mysql/              StatefulSet, PVC, Secret, init ConfigMap
│   ├── backend/            Deployment, Service, HPA, ConfigMap/Secret
│   ├── frontend/           Deployment, Service, HPA
│   ├── ingress/            ALB Ingress
│   ├── monitoring/         ServiceMonitor + PrometheusRule
│   └── kustomization.yaml  Ties everything together (`kubectl apply -k k8s/`)
├── Jenkinsfile            Full CI/CD pipeline
└── docker-compose.yml     Local dev: mysql + backend + frontend
```

## Run it locally first

```bash
docker compose up --build
# frontend  → http://localhost:3000
# backend   → http://localhost:5000/healthz
# mysql     → localhost:3306 (bloguser / changeme)
```

The seed data ships four demo posts; register a new account to write your own entries.

## Prerequisites for the real EKS deployment

1. **EKS cluster** (`eksctl create cluster ...`) with:
   - AWS EBS CSI driver add-on (for the `gp3` StorageClass / MySQL PVC)
   - AWS Load Balancer Controller add-on (for the ALB Ingress)
   - An ACM certificate for your domain, referenced in `k8s/ingress/ingress.yaml`
2. **ECR** repositories: `blogapp-backend`, `blogapp-frontend`
3. **Nexus** repository (npm-hosted) reachable from the Jenkins agent
4. **SonarQube** server + a Jenkins `sonarqube-server` configuration
5. **Trivy** installed on the Jenkins agent (or run as a container step)
6. **kube-prometheus-stack** installed via Helm in a `monitoring` namespace
   (provides the Prometheus Operator CRDs the `ServiceMonitor`/`PrometheusRule` need)
7. Jenkins credentials: `aws-creds`, `sonarqube-token`, `nexus-creds`, `ecr-registry` (string)

## Deploying manually (what the pipeline automates)

```bash
aws eks update-kubeconfig --name blogapp-eks-cluster --region ap-south-1

# Load the real schema into the init ConfigMap
kubectl create configmap mysql-init-script \
  --from-file=init.sql=database/init.sql -n blogapp \
  --dry-run=client -o yaml | kubectl apply -f -

# Build & push images
docker build -t <ECR_REGISTRY>/blogapp-backend:v1 ./backend
docker build -t <ECR_REGISTRY>/blogapp-frontend:v1 ./frontend
trivy image --severity CRITICAL,HIGH <ECR_REGISTRY>/blogapp-backend:v1
docker push <ECR_REGISTRY>/blogapp-backend:v1
docker push <ECR_REGISTRY>/blogapp-frontend:v1

# Point the manifests at the images you just pushed, then apply
sed -i "s#<ECR_REGISTRY>/blogapp-backend:IMAGE_TAG#<ECR_REGISTRY>/blogapp-backend:v1#" k8s/backend/deployment.yaml
sed -i "s#<ECR_REGISTRY>/blogapp-frontend:IMAGE_TAG#<ECR_REGISTRY>/blogapp-frontend:v1#" k8s/frontend/deployment.yaml
kubectl apply -k k8s/
kubectl rollout status deployment/backend -n blogapp
kubectl rollout status deployment/frontend -n blogapp
kubectl get ingress blogapp-ingress -n blogapp
```

## Secrets — replace before real use

`k8s/mysql/secret.yaml` and `k8s/backend/config.yaml` contain placeholder passwords
(`REPLACE_WITH_...`). For production, don't commit real secrets — pull them from
AWS Secrets Manager via the External Secrets Operator, or inject them at deploy time
from a Jenkins credential store.

## What each tool is doing in the pipeline

| Stage | Tool | Purpose |
|---|---|---|
| Static analysis | **SonarQube** | Code smells, bugs, coverage, quality gate blocks bad merges |
| Artifact storage | **Nexus** | Versioned backend package storage, single source of truth for releases |
| Image scanning | **Trivy** | Fails the build on CRITICAL/HIGH CVEs in either image, plus a filesystem/dependency scan |
| Registry | **ECR** | Stores the scanned, tagged images the cluster pulls from |
| Deploy | **kubectl + kustomize** | Applies the full manifest set to EKS, waits for rollout health |
| Monitoring | **Prometheus + Grafana** | Scrapes `/metrics`, alerts on error rate / crash loops / DB availability |

## Frontend design notes

The UI ("Marginal") is a custom-built design system, not a component-library
default: a paper-grain background, Fraunces/Inter/IBM Plex Mono type pairing,
moss-and-rust accent ink, and a signature **reading-spine** scroll-progress
ruler on article pages. All tokens live in `frontend/src/index.css`.
