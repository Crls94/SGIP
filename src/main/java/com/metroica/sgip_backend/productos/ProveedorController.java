package com.metroica.sgip_backend.productos;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/proveedores")
@RequiredArgsConstructor
public class ProveedorController {

    private final ProveedorRepository proveedorRepository;

    @GetMapping
    public ResponseEntity<List<Proveedor>> listarProveedores(@RequestParam(required = false) Boolean activo) {
        if (activo != null) {
            return ResponseEntity.ok(proveedorRepository.findByActivoOrderByNombreAsc(activo));
        }
        return ResponseEntity.ok(proveedorRepository.findAllByOrderByNombreAsc());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Proveedor> crearProveedor(@RequestBody @Valid Proveedor proveedor) {
        proveedor.setId(null);
        proveedor.setActivo(true);
        return ResponseEntity.status(HttpStatus.CREATED).body(proveedorRepository.save(proveedor));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Proveedor> actualizarProveedor(@PathVariable Integer id, @RequestBody @Valid Proveedor proveedor) {
        Proveedor existente = proveedorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado: " + id));
        existente.setNombre(proveedor.getNombre());
        existente.setRuc(proveedor.getRuc());
        existente.setContacto(proveedor.getContacto());
        existente.setTelefono(proveedor.getTelefono());
        existente.setEmail(proveedor.getEmail());
        existente.setDireccion(proveedor.getDireccion());
        existente.setLeadTimeDias(proveedor.getLeadTimeDias());
        return ResponseEntity.ok(proveedorRepository.save(existente));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> eliminarProveedor(@PathVariable Integer id) {
        cambiarActivo(id, false);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/desactivar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Proveedor> desactivarProveedor(@PathVariable Integer id) {
        return ResponseEntity.ok(cambiarActivo(id, false));
    }

    @PatchMapping("/{id}/activar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Proveedor> activarProveedor(@PathVariable Integer id) {
        return ResponseEntity.ok(cambiarActivo(id, true));
    }

    private Proveedor cambiarActivo(Integer id, boolean activo) {
        Proveedor proveedor = proveedorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado: " + id));
        proveedor.setActivo(activo);
        return proveedorRepository.save(proveedor);
    }
}
