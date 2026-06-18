package com.metroica.sgip_backend.selenium;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import static org.junit.jupiter.api.Assertions.assertTrue;

@EnabledIfEnvironmentVariable(named = "RUN_SELENIUM_TESTS", matches = "true")
class LoginSeleniumTest {

    @Test
    void paginaLoginCargaFormularioPrincipal() {
        // Cambios 17/07: Prueba funcional web con Selenium asociada al RF-01 Autenticacion.
        // Se ejecuta solo si RUN_SELENIUM_TESTS=true para evitar fallos cuando el frontend no esta levantado.

        // Preparacion: la URL del frontend es configurable para usar Vite local o un despliegue real.
        String baseUrl = System.getenv().getOrDefault("SGIP_FRONTEND_URL", "http://localhost:5173");
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");

        WebDriver driver = new ChromeDriver(options);
        try {
            // Ejecucion: Selenium abre la interfaz web como lo haria un usuario real.
            driver.get(baseUrl);

            // Validacion: se verifica que la pagina contenga algun campo de entrada propio del login.
            WebElement body = driver.findElement(By.tagName("body"));
            assertTrue(body.getText().toLowerCase().contains("login")
                    || !driver.findElements(By.cssSelector("input[type='email'], input[type='password'], input[name='email']")).isEmpty());
        } finally {
            // Limpieza: siempre se cierra el navegador para no dejar procesos abiertos.
            driver.quit();
        }
    }
}
