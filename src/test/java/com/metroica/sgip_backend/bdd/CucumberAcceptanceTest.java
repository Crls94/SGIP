package com.metroica.sgip_backend.bdd;

import org.junit.platform.suite.api.ConfigurationParameter;
import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectClasspathResource;
import org.junit.platform.suite.api.Suite;

import static io.cucumber.junit.platform.engine.Constants.GLUE_PROPERTY_NAME;

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features")
@ConfigurationParameter(key = GLUE_PROPERTY_NAME, value = "com.metroica.sgip_backend.bdd")
class CucumberAcceptanceTest {
    // Cambios 17/07: Runner de Cucumber para pruebas de aceptacion BDD.
    // Este archivo conecta los escenarios .feature con los pasos Java ubicados en el paquete bdd.
}
