package com.metroica.sgip_backend;

import com.metroica.sgip_backend.pedidos.PedidoRepository;
import com.metroica.sgip_backend.productos.ProductoRepository;
import com.metroica.sgip_backend.seguridad.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@EnabledIfEnvironmentVariable(named = "RUN_INTEGRATION_TESTS", matches = "true")
class IntegrationDatabaseSmokeTest {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void repositoriesConectanConPostgreSql() {
        assertTrue(productoRepository.count() >= 0);
        assertTrue(pedidoRepository.count() >= 0);
        assertTrue(usuarioRepository.count() >= 0);
    }
}
