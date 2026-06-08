package com.metroica.sgip_backend.seguridad;

import com.metroica.sgip_backend.config.JwtUtil;
import com.metroica.sgip_backend.shared.enums.RolUsuario;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
/**
 * Servicio de autenticación y registro de usuarios.
 * Valida credenciales, cifra contraseñas con BCrypt y emite tokens JWT para el frontend.
 */
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO request) {
        Usuario usuario = usuarioRepository.findByEmailAndActivoTrue(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Credenciales invalidas"));

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPasswordHash())) {
            throw new RuntimeException("Credenciales invalidas");
        }

        String token = jwtUtil.generateToken(usuario.getId(), usuario.getEmail(), usuario.getRol().name());

        usuario.setUltimoLogin(java.time.LocalDateTime.now());
        usuarioRepository.save(usuario);

        return new LoginResponseDTO(token, usuario.getEmail(), usuario.getNombre(), usuario.getRol().name());
    }

    @Transactional
    public LoginResponseDTO register(RegisterRequestDTO request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Ya existe un usuario con el email: " + request.getEmail());
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setApellido(request.getApellido());
        usuario.setEmail(request.getEmail());
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(RolUsuario.OPERARIO);
        usuario.setActivo(true);

        usuarioRepository.save(usuario);

        String token = jwtUtil.generateToken(usuario.getId(), usuario.getEmail(), usuario.getRol().name());

        return new LoginResponseDTO(token, usuario.getEmail(), usuario.getNombre(), usuario.getRol().name());
    }
}
