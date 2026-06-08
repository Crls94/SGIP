package com.metroica.sgip_backend.config;

import com.metroica.sgip_backend.seguridad.Usuario;
import com.metroica.sgip_backend.seguridad.UsuarioRepository;
import com.metroica.sgip_backend.shared.enums.RolUsuario;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        List<Usuario> corruptos = usuarioRepository.findAll().stream()
                .filter(u -> "PENDING_HASH".equals(u.getPasswordHash()) || "hash".equals(u.getPasswordHash()))
                .toList();

        if (!corruptos.isEmpty()) {
            System.out.println("=== REPARANDO CONTRASEÑAS DE DESARROLLO (PENDING_HASH -> BCrypt) ===");
            for (Usuario u : corruptos) {
                String defaultPass = switch (u.getRol()) {
                    case ADMINISTRADOR -> "admin123";
                    case GERENTE -> "gerente123";
                    default -> "operario123";
                };
                u.setPasswordHash(passwordEncoder.encode(defaultPass));
                usuarioRepository.save(u);
            }
            System.out.println("Usuarios de desarrollo reparados: " + corruptos.size());
        }

        if (usuarioRepository.count() == 0) {
            Usuario admin = new Usuario();
            admin.setNombre("Admin");
            admin.setApellido("Sistema");
            admin.setEmail("admin@metroica.com");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRol(RolUsuario.ADMINISTRADOR);
            admin.setActivo(true);
            usuarioRepository.save(admin);

            Usuario operario = new Usuario();
            operario.setNombre("Operario");
            operario.setApellido("Tienda");
            operario.setEmail("operario@metroica.com");
            operario.setPasswordHash(passwordEncoder.encode("operario123"));
            operario.setRol(RolUsuario.OPERARIO);
            operario.setActivo(true);
            usuarioRepository.save(operario);

            Usuario gerente = new Usuario();
            gerente.setNombre("Gerente");
            gerente.setApellido("General");
            gerente.setEmail("gerente@metroica.com");
            gerente.setPasswordHash(passwordEncoder.encode("gerente123"));
            gerente.setRol(RolUsuario.GERENTE);
            gerente.setActivo(true);
            usuarioRepository.save(gerente);

            System.out.println("=== USUARIOS DE DESARROLLO CREADOS ===");
        }
    }
}
