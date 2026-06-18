pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Unit, Integration, Regression and Smoke Tests') {
            steps {
                // Cambios 17/07: Jenkins ejecuta la suite Maven/JUnit en integracion continua.
                sh './mvnw test'
            }
        }

        stage('Optional Selenium Tests') {
            when {
                expression { return env.RUN_SELENIUM_TESTS == 'true' }
            }
            steps {
                // Cambios 17/07: Selenium se ejecuta solo cuando existe navegador y frontend disponible.
                sh 'RUN_SELENIUM_TESTS=true ./mvnw -Dtest=LoginSeleniumTest test'
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'target/surefire-reports/*.xml'
        }
    }
}
