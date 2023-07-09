
pipeline {
    agent {
        label 'EC2Slave-docker'
        
    }
    
    environment {
        imageName = "divyabilson/nodejsapp2-repo:${BUILD_NUMBER}"
        containerName = "nodetest2"
        DOCKERHUB_CREDENTIALS = credentials('dockerhub')
        GITHUB_URL = "https://github.com/divyabilson/app2"
        APP_SERVER_IP = "54.227.89.75"
        USERNAME = "ubuntu"
        AWS_KEY_ID = "web_server_1"
        
    }

    tools {
        nodejs 'nodejs'
        
    }
    
    stages {
        stage('Cleanup') {
            steps {
                cleanWs()
                
            }
            
        }
        stage('Checkout source repo') {
      steps {
         checkout scm
      }
    }
        
        stage('Build') {
            steps {
                sh 'git clone $GITHUB_URL'
                sh 'docker system prune -af'
                sh 'docker build -t $imageName .'
                sh 'docker stop $containerName || true && docker rm -f $containerName || true'
                sh 'docker run -p 3000:3000 -d --name $containerName $imageName'
                
            }
            
        }
        stage('Push Image to dockerhub') {
            steps {
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
                sh 'docker image push $imageName'
                
            }
            
        }
        stage('Deploy to AWS EC2') {
            steps {
                // Connect to the AWS EC2 instance using SSH
                withCredentials([sshUserPrivateKey(credentialsId: 'web_server_1', keyFileVariable: 'SSH_KEY_PATH')]) {
                    sh '''
                    chmod 400 $SSH_KEY_PATH
                    docker save -o image${BUILD_NUMBER}.tar $imageName
                    ssh -o StrictHostKeyChecking=no -i $SSH_KEY_PATH $USERNAME@$APP_SERVER_IP 'rm -rf image*.tar'
                    scp -o StrictHostKeyChecking=no -i $SSH_KEY_PATH -r image${BUILD_NUMBER}.tar $USERNAME@$APP_SERVER_IP:~
                    ssh -o StrictHostKeyChecking=no -i $SSH_KEY_PATH $USERNAME@$APP_SERVER_IP 'docker rm -f nodejsapp2'
                    ssh -o StrictHostKeyChecking=no -i $SSH_KEY_PATH $USERNAME@$APP_SERVER_IP 'docker rmi -f $(docker images -q) 2> /dev/null'
                    ssh -o StrictHostKeyChecking=no -i $SSH_KEY_PATH $USERNAME@$APP_SERVER_IP 'sudo docker load -i image*.tar'
                    ssh -o StrictHostKeyChecking=no -i $SSH_KEY_PATH $USERNAME@$APP_SERVER_IP 'docker run -p 80:3000 -d --restart unless-stopped --name nodejsapp2 $(docker images -qa)'
                    ssh -o StrictHostKeyChecking=no -i $SSH_KEY_PATH $USERNAME@$APP_SERVER_IP 'rm -rf image*.tar'
                    '''
                }
                
            }
            
        }
        
    }
    post {
        always {
            sh 'docker logout'
            
        }
        
    }
    
}
