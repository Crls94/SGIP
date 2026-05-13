package com.metroica.sgip_backend.seguridad;

import com.metroica.sgip_backend.shared.enums.RolUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByEmailAndActivoTrue(String email);

    boolean existsByEmail(String email);

    List<Usuario> findByRolAndActivoTrue(RolUsuario rol);

    long countByRolAndActivoTrue(RolUsuario rol);
}
