Feature: Aceptacion de flujos principales de SGIP

  Scenario: RF-06 Cola de pedidos prioriza delivery
    Given existen pedidos pendientes local y delivery
    When el operario consulta la cola de pedidos
    Then el pedido delivery aparece antes que el pedido local

  Scenario: RF-08 Dashboard gerencial disponible para administrador
    Given un usuario autenticado con rol "ADMINISTRADOR"
    When intenta ingresar al dashboard gerencial
    Then el sistema permite visualizar las metricas gerenciales
