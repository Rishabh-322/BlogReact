pipeline {

    agent any

    environment {
        AWS_REGION = 'ap-south-1'
        EKS_CLUSTER = 'blogapp-eks'
        NAMESPACE = 'blogapp'

        ECR_REGISTRY = '076971082275.dkr.ecr.ap-south-1.amazonaws.com'

        BACKEND_REPOSITORY = 'blogapp-backend'
        FRONTEND_REPOSITORY = 'blogapp-frontend'

        NEXUS_URL = 'http://127.0.0.1:8081'
        NEXUS_REPOSITORY = 'blog-artifacts'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Install & Test') {
            steps {
                sh '''
                    cd backend
                    npm ci
                    npm test
                '''
            }
        }

        stage('Frontend Install & Build') {
            steps {
                sh '''
                    cd frontend
                    npm ci
                    npm run build
                '''
            }
        }

        stage('SonarQube Backend') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'

                    withSonarQubeEnv('sonarqube-server') {
                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.projectKey=blogapp-backend \
                            -Dsonar.projectName=blogapp-backend \
                            -Dsonar.sources=backend/src
                        """
                    }
                }
            }
        }

        stage('Backend Quality Gate') {
            steps {
                timeout(
                    time: 5,
                    unit: 'MINUTES'
                ) {
                    waitForQualityGate(
                        abortPipeline: true
                    )
                }
            }
        }

        stage('SonarQube Frontend') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'

                    withSonarQubeEnv('sonarqube-server') {
                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.projectKey=blogapp-frontend \
                            -Dsonar.projectName=blogapp-frontend \
                            -Dsonar.sources=frontend/src
                        """
                    }
                }
            }
        }

        stage('Frontend Quality Gate') {
            steps {
                timeout(
                    time: 5,
                    unit: 'MINUTES'
                ) {
                    waitForQualityGate(
                        abortPipeline: true
                    )
                }
            }
        }

        stage('Package Artifacts') {
            steps {
                sh '''
                    rm -rf artifacts
                    mkdir artifacts

                    cd backend
                    npm pack \
                    --pack-destination ../artifacts

                    cd ../frontend
                    npm pack \
                    --pack-destination ../artifacts
                '''
            }
        }

        stage('Upload to Nexus') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'nexus-creds',
                        usernameVariable: 'NEXUS_USER',
                        passwordVariable: 'NEXUS_PASSWORD'
                    )
                ]) {
                    sh '''
                        for file in artifacts/*.tgz
                        do
                            filename=$(basename "$file")

                            curl \
                                --fail \
                                -u "$NEXUS_USER:$NEXUS_PASSWORD" \
                                --upload-file "$file" \
                                "$NEXUS_URL/repository/$NEXUS_REPOSITORY/build-$BUILD_NUMBER/$filename"
                        done
                    '''
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh '''
                    docker build \
                    -t $ECR_REGISTRY/$BACKEND_REPOSITORY:$BUILD_NUMBER \
                    ./backend

                    docker build \
                    -t $ECR_REGISTRY/$FRONTEND_REPOSITORY:$BUILD_NUMBER \
                    ./frontend
                '''
            }
        }

        stage('Trivy Scan') {
            steps {
                sh '''
                    docker run --rm \
                    -v /var/run/docker.sock:/var/run/docker.sock \
                    aquasec/trivy:latest \
                    image \
                    --severity HIGH,CRITICAL \
                    --exit-code 0 \
                    $ECR_REGISTRY/$BACKEND_REPOSITORY:$BUILD_NUMBER

                    docker run --rm \
                    -v /var/run/docker.sock:/var/run/docker.sock \
                    aquasec/trivy:latest \
                    image \
                    --severity CRITICAL \
                    --exit-code 1 \
                    $ECR_REGISTRY/$BACKEND_REPOSITORY:$BUILD_NUMBER

                    docker run --rm \
                    -v /var/run/docker.sock:/var/run/docker.sock \
                    aquasec/trivy:latest \
                    image \
                    --severity HIGH,CRITICAL \
                    --exit-code 0 \
                    $ECR_REGISTRY/$FRONTEND_REPOSITORY:$BUILD_NUMBER

                    docker run --rm \
                    -v /var/run/docker.sock:/var/run/docker.sock \
                    aquasec/trivy:latest \
                    image \
                    --severity CRITICAL \
                    --exit-code 1 \
                    $ECR_REGISTRY/$FRONTEND_REPOSITORY:$BUILD_NUMBER
                '''
            }
        }

        stage('Push Images to ECR') {
            steps {
                sh '''
                    aws ecr get-login-password \
                    --region $AWS_REGION \
                    | docker login \
                    --username AWS \
                    --password-stdin \
                    $ECR_REGISTRY

                    docker push \
                    $ECR_REGISTRY/$BACKEND_REPOSITORY:$BUILD_NUMBER

                    docker push \
                    $ECR_REGISTRY/$FRONTEND_REPOSITORY:$BUILD_NUMBER
                '''
            }
        }

        stage('Deploy to EKS') {
            steps {
                sh '''
                    aws eks update-kubeconfig \
                    --name $EKS_CLUSTER \
                    --region $AWS_REGION

                    kubectl set image \
                    deployment/backend \
                    backend=$ECR_REGISTRY/$BACKEND_REPOSITORY:$BUILD_NUMBER \
                    -n $NAMESPACE

                    kubectl set image \
                    deployment/frontend \
                    frontend=$ECR_REGISTRY/$FRONTEND_REPOSITORY:$BUILD_NUMBER \
                    -n $NAMESPACE
                '''
            }
        }

        stage('Deployment Validation') {
            steps {
                sh '''
                    kubectl rollout status \
                    deployment/backend \
                    -n $NAMESPACE \
                    --timeout=180s

                    kubectl rollout status \
                    deployment/frontend \
                    -n $NAMESPACE \
                    --timeout=180s

                    kubectl get pods \
                    -n $NAMESPACE

                    kubectl get ingress \
                    -n $NAMESPACE
                '''
            }
        }
    }

    post {

        success {
            echo 'Blog application deployment successful'
        }

        failure {
            echo 'Pipeline failed - deployment stopped'
        }

        always {
            sh '''
                docker image prune -f || true
            '''
        }
    }
}