package com.metroica.sgip_backend.dashboard;

import com.metroica.sgip_backend.alertas.AlertaStockRepository;
import com.metroica.sgip_backend.inteligencia.InteligenciaService;
import com.metroica.sgip_backend.inteligencia.PrediccionDemanda;
import com.metroica.sgip_backend.pedidos.PedidoRepository;
import com.metroica.sgip_backend.productos.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final AlertaStockRepository alertaStockRepository;
    private final PedidoRepository pedidoRepository;
    private final InteligenciaService inteligenciaService;
    private final ProductoRepository productoRepository;
    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboard() {
        Map<String, Object> dashboard = new LinkedHashMap<>();

        dashboard.put("alertasStockCritico", alertaStockRepository.countAlertasActivas());
        dashboard.put("pedidosEnCola", pedidoRepository.countPedidosActivos());
        dashboard.put("productosConStockBajo", productoRepository.findProductosConStockCritico().size());

        PrediccionDemanda ultimaPrediccion = inteligenciaService.obtenerUltimaPrediccion();

        if (ultimaPrediccion != null) {
            Map<String, Object> info = new LinkedHashMap<>();
            info.put("modelo", ultimaPrediccion.getModeloVersion());
            info.put("confianza", ultimaPrediccion.getConfianza());
            info.put("generadoEn", ultimaPrediccion.getGeneradoEn());
            dashboard.put("ultimaPrediccion", info);
        } else {
            dashboard.put("ultimaPrediccion", null);
        }

        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/ventas-7-dias")
    public ResponseEntity<List<VentaDiariaDTO>> ventas7Dias() {
        return ResponseEntity.ok(dashboardService.getVentasUltimos7Dias());
    }
}