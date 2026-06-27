package com.metroica.sgip_backend.dashboard;

import com.metroica.sgip_backend.pedidos.PedidoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private PedidoRepository pedidoRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    void getVentasUltimos7DiasCompletaDiasSinVentasConCero() {
        LocalDate hoy = LocalDate.now();
        when(pedidoRepository.findVentasUltimos7Dias()).thenReturn(List.of(
                new Object[]{Date.valueOf(hoy.minusDays(2)), BigDecimal.valueOf(150.50), 3L},
                new Object[]{Date.valueOf(hoy), BigDecimal.valueOf(80), 1L}
        ));

        List<VentaDiariaDTO> ventas = dashboardService.getVentasUltimos7Dias();

        assertEquals(7, ventas.size());
        assertEquals(hoy.minusDays(6), ventas.get(0).getFecha());
        assertEquals(BigDecimal.ZERO, ventas.get(0).getTotal());
        assertEquals(0, ventas.get(0).getCantidad());
        assertEquals(BigDecimal.valueOf(150.50), ventas.get(4).getTotal());
        assertEquals(3, ventas.get(4).getCantidad());
        assertEquals(BigDecimal.valueOf(80), ventas.get(6).getTotal());
    }

    @Test
    void getVentasUltimos7DiasDevuelveOrdenCronologico() {
        when(pedidoRepository.findVentasUltimos7Dias()).thenReturn(List.of());

        List<VentaDiariaDTO> ventas = dashboardService.getVentasUltimos7Dias();

        for (int i = 1; i < ventas.size(); i++) {
            assertEquals(ventas.get(i - 1).getFecha().plusDays(1), ventas.get(i).getFecha());
        }
    }
}
