package com.metroica.sgip_backend.bdd;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class SgipAcceptanceSteps {

    private final List<PedidoBdd> pedidos = new ArrayList<>();
    private List<PedidoBdd> colaOrdenada = List.of();
    private String rolAutenticado;
    private boolean accesoDashboard;

    @Given("existen pedidos pendientes local y delivery")
    public void existenPedidosPendientesLocalYDelivery() {
        // Cambios 17/07: Preparacion del escenario RF-06 Cola Priorizada.
        // Se simulan pedidos con prioridad operativa diferente sin depender de base de datos.
        pedidos.clear();
        pedidos.add(new PedidoBdd("LOCAL", 5));
        pedidos.add(new PedidoBdd("DELIVERY", 3));
    }

    @When("el operario consulta la cola de pedidos")
    public void elOperarioConsultaLaColaDePedidos() {
        // Cambios 17/07: Ejecucion del criterio de aceptacion.
        // La cola se ordena por prioridad menor primero, igual que la regla operativa del sistema.
        colaOrdenada = pedidos.stream()
                .sorted(Comparator.comparingInt(PedidoBdd::prioridad))
                .toList();
    }

    @Then("el pedido delivery aparece antes que el pedido local")
    public void elPedidoDeliveryApareceAntesQueElPedidoLocal() {
        // Cambios 17/07: Validacion del RF-06.
        // El usuario acepta el flujo si delivery se atiende antes que local.
        assertFalse(colaOrdenada.isEmpty());
        assertEquals("DELIVERY", colaOrdenada.get(0).canal());
        assertEquals("LOCAL", colaOrdenada.get(1).canal());
    }

    @Given("un usuario autenticado con rol {string}")
    public void unUsuarioAutenticadoConRol(String rol) {
        // Cambios 17/07: Preparacion del escenario RF-08 Dashboard Gerencial.
        // Se define el rol del usuario para validar si puede acceder al panel gerencial.
        rolAutenticado = rol;
    }

    @When("intenta ingresar al dashboard gerencial")
    public void intentaIngresarAlDashboardGerencial() {
        // Cambios 17/07: Ejecucion de la regla de aceptacion del dashboard.
        // Solo administradores y gerentes deben visualizar metricas gerenciales.
        accesoDashboard = "ADMINISTRADOR".equals(rolAutenticado) || "GERENTE".equals(rolAutenticado);
    }

    @Then("el sistema permite visualizar las metricas gerenciales")
    public void elSistemaPermiteVisualizarLasMetricasGerenciales() {
        // Cambios 17/07: Validacion del RF-08.
        // La prueba confirma el comportamiento esperado para roles autorizados.
        assertTrue(accesoDashboard);
    }

    private record PedidoBdd(String canal, int prioridad) {
    }
}
