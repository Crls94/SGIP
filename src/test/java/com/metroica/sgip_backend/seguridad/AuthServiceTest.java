package com.metroica.sgip_backend.seguridad;

import com.metroica.sgip_backend.config.JwtUtil;
import com.metroica.sgip_backend.shared.enums.RolUsuario;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Spy
    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @InjectMocks
    private AuthService authService;

    @Test
    void loginCorrectoGeneraToken() {
        Usuario usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        usuario.setEmail("admin@metroica.pe");
        usuario.setNombre("Admin");
        usuario.setRol(RolUsuario.ADMINISTRADOR);
        usuario.setPasswordHash(passwordEncoder.encode("admin123"));

        LoginRequestDTO request = new LoginRequestDTO();
        request.setEmail("admin@metroica.pe");
        request.setPassword("admin123");

        when(usuarioRepository.findByEmailAndActivoTrue("admin@metroica.pe")).thenReturn(Optional.of(usuario));
        when(jwtUtil.generateToken(usuario.getId(), usuario.getEmail(), usuario.getRol().name())).thenReturn("jwt-token");

        LoginResponseDTO response = authService.login(request);

        assertEquals("jwt-token", response.getToken());
        assertEquals("ADMINISTRADOR", response.getRol());
        verify(usuarioRepository).save(usuario);
    }

    @Test
    void loginConPasswordIncorrectoFalla() {
        Usuario usuario = new Usuario();
        usuario.setEmail("admin@metroica.pe");
        usuario.setPasswordHash(passwordEncoder.encode("admin123"));

        LoginRequestDTO request = new LoginRequestDTO();
        request.setEmail("admin@metroica.pe");
        request.setPassword("incorrecta");

        when(usuarioRepository.findByEmailAndActivoTrue("admin@metroica.pe")).thenReturn(Optional.of(usuario));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.login(request));

        assertEquals("Credenciales invalidas", ex.getMessage());
    }

    @Test
    void registerGuardaPasswordCifrado() {
        RegisterRequestDTO request = new RegisterRequestDTO();
        request.setNombre("Carlos");
        request.setApellido("Diaz");
        request.setEmail("carlos@metroica.pe");
        request.setPassword("segura123");

        when(usuarioRepository.existsByEmail("carlos@metroica.pe")).thenReturn(false);
        when(jwtUtil.generateToken(any(), any(), any())).thenReturn("jwt-token");

        LoginResponseDTO response = authService.register(request);

        assertEquals("jwt-token", response.getToken());
        verify(usuarioRepository).save(org.mockito.ArgumentMatchers.argThat(usuario ->
                passwordEncoder.matches("segura123", usuario.getPasswordHash())
                        && usuario.getRol() == RolUsuario.OPERARIO
                        && usuario.getActivo()));
    }

    @Test
    void registerRechazaEmailDuplicado() {
        RegisterRequestDTO request = new RegisterRequestDTO();
        request.setEmail("existe@metroica.pe");

        when(usuarioRepository.existsByEmail("existe@metroica.pe")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.register(request));

        assertTrue(ex.getMessage().contains("Ya existe un usuario"));
    }
}
