package com.metroica.sgip_backend.dashboard;

import com.metroica.sgip_backend.pedidos.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PedidoRepository pedidoRepository;

    @Transactional(readOnly = true)
    public List<VentaDiariaDTO> getVentasUltimos7Dias() {
        List<Object[]> raw = pedidoRepository.findVentasUltimos7Dias();

        Map<LocalDate, VentaDiariaDTO> map = raw.stream()
                .collect(Collectors.toMap(
                        r -> ((java.sql.Date) r[0]).toLocalDate(),
                        r -> {
                            VentaDiariaDTO dto = new VentaDiariaDTO();
                            dto.setFecha(((java.sql.Date) r[0]).toLocalDate());
                            dto.setTotal((BigDecimal) r[1]);
                            dto.setCantidad(((Number) r[2]).intValue());
                            return dto;
                        }
                ));

        List<VentaDiariaDTO> result = new ArrayList<>();
        LocalDate hoy = LocalDate.now();
        for (int i = 6; i >= 0; i--) {
            LocalDate dia = hoy.minusDays(i);
            VentaDiariaDTO dto = map.get(dia);
            if (dto == null) {
                dto = new VentaDiariaDTO();
                dto.setFecha(dia);
                dto.setTotal(BigDecimal.ZERO);
                dto.setCantidad(0);
            }
            result.add(dto);
        }
        return result;
    }
}
