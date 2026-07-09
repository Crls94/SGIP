package com.metroica.sgip_backend.productos;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProveedorRepository extends JpaRepository<Proveedor, Integer> {

    List<Proveedor> findByActivoTrueOrderByNombreAsc();

    List<Proveedor> findByActivoOrderByNombreAsc(Boolean activo);

    List<Proveedor> findAllByOrderByNombreAsc();
}
