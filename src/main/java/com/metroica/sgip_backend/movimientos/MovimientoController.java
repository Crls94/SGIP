package com.metroica.sgip_backend.movimientos;

import com.metroica.sgip_backend.shared.enums.TipoMovimiento;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.persistence.criteria.Predicate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/movimientos")
@RequiredArgsConstructor
public class MovimientoController {

    private final MovimientoService movimientoService;
    private final MovimientoRepository movimientoRepository;

    @PostMapping
    public ResponseEntity<String> registrarMovimiento(@Valid @RequestBody MovimientoRequestDTO request) {
        String resultado = movimientoService.registrarMovimientoReal(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
    }

    @GetMapping
    public ResponseEntity<Page<MovimientoResponseDTO>> listarMovimientos(
            @RequestParam(required = false) UUID productoId,
            @RequestParam(required = false) TipoMovimiento tipo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaHasta,
            @PageableDefault(size = 20, sort = "fecha", direction = Sort.Direction.DESC) Pageable pageable) {
        Specification<InventarioMovimiento> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (productoId != null) {
                predicates.add(criteriaBuilder.equal(root.get("producto").get("id"), productoId));
            }
            if (tipo != null) {
                predicates.add(criteriaBuilder.equal(root.get("tipo"), tipo));
            }
            if (fechaDesde != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("fecha"), fechaDesde));
            }
            if (fechaHasta != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("fecha"), fechaHasta));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };

        Page<MovimientoResponseDTO> movimientos = movimientoRepository
                .findAll(spec, pageable)
                .map(MovimientoResponseDTO::fromEntity);
        return ResponseEntity.ok(movimientos);
    }
}
