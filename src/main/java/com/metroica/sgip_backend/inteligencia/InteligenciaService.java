package com.metroica.sgip_backend.inteligencia;

import com.metroica.sgip_backend.movimientos.MovimientoRepository;
import com.metroica.sgip_backend.shared.enums.TipoMovimiento;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InteligenciaService {

    private final MovimientoRepository movimientoRepository;
    private final MovimientoExportMapper mapper;
    private final PrediccionRepository prediccionRepository;

    @Transactional(readOnly = true)
    public List<MovimientoExportDTO> extraerDatosEntrenamiento() {
        return movimientoRepository.findByTipoOrderByFechaAsc(TipoMovimiento.SALIDA)
                .stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PrediccionResponseDTO> obtenerPredicciones() {
        return prediccionRepository.findUltimasPredicciones()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PrediccionDemanda obtenerUltimaPrediccion() {
        return prediccionRepository.findTopByOrderByGeneradoEnDesc().orElse(null);
    }

    private PrediccionResponseDTO toDTO(PrediccionDemanda p) {
        PrediccionResponseDTO dto = new PrediccionResponseDTO();
        dto.setId(p.getId());
        dto.setProductoId(p.getProducto() != null ? p.getProducto().getId() : null);
        dto.setProductoNombre(p.getProducto() != null ? p.getProducto().getNombre() : null);
        dto.setSemanaInicio(p.getSemanaInicio());
        dto.setSemanaFin(p.getSemanaFin());
        dto.setCantidadPredicha(p.getCantidadPredicha());
        dto.setCantidadReal(p.getCantidadReal());
        dto.setErrorPorcentaje(p.getErrorPorcentaje());
        dto.setConfianza(p.getConfianza());
        dto.setModeloVersion(p.getModeloVersion());
        dto.setGeneradoEn(p.getGeneradoEn());
        return dto;
    }
}
