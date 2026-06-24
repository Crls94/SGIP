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
        // Cambios 17/07: Prueba unitaria asociada al RF-01 Autenticacion.
        // Valida que credenciales correctas generen token JWT y devuelvan el rol del usuario.

        // Preparacion: se crea un usuario activo con password cifrado como estaria en la base de datos.
        Usuario usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        usuario.setEmail("admin@metroica.com");
        usuario.setNombre("Admin");
        usuario.setRol(RolUsuario.ADMINISTRADOR);
        usuario.setPasswordHash(passwordEncoder.encode("admin123"));

        // Datos de prueba: credenciales correctas enviadas desde el formulario de login.
        LoginRequestDTO request = new LoginRequestDTO();
        request.setEmail("admin@metroica.com");
        request.setPassword("admin123");

        // Simulacion: el repositorio encuentra al usuario activo y JWT genera un token valido.
        when(usuarioRepository.findByEmailAndActivoTrue("admin@metroica.com")).thenReturn(Optional.of(usuario));
        when(jwtUtil.generateToken(usuario.getId(), usuario.getEmail(), usuario.getRol().name())).thenReturn("jwt-token");

        // Ejecucion: se invoca el servicio de autenticacion.
        LoginResponseDTO response = authService.login(request);

        // Validacion: la respuesta contiene token, rol y registra actividad del usuario.
        assertEquals("jwt-token", response.getToken());
        assertEquals("ADMINISTRADOR", response.getRol());
        verify(usuarioRepository).save(usuario);
    }

    @Test
    void loginConPasswordIncorrectoFalla() {
        // Cambios 17/07: Prueba negativa asociada al RF-01 Autenticacion.
        // Comprueba que una contrasena incorrecta no permita el acceso al sistema.

        // Preparacion: el usuario existe, pero su password real es distinto al enviado.
        Usuario usuario = new Usuario();
        usuario.setEmail("admin@metroica.com");
        usuario.setPasswordHash(passwordEncoder.encode("admin123"));

        // Datos de prueba: se usa una contrasena incorrecta para simular intento fallido.
        LoginRequestDTO request = new LoginRequestDTO();
        request.setEmail("admin@metroica.com");
        request.setPassword("incorrecta");

        // Simulacion: el sistema encuentra al usuario activo por correo.
        when(usuarioRepository.findByEmailAndActivoTrue("admin@metroica.com")).thenReturn(Optional.of(usuario));

        // Ejecucion y validacion: el servicio debe rechazar las credenciales invalidas.
        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.login(request));

        assertEquals("Credenciales invalidas", ex.getMessage());
    }

    @Test
    void registerGuardaPasswordCifrado() {
        // Cambios 17/07: Prueba de seguridad asociada al RNF Seguridad.
        // Demuestra que la contrasena se almacena con BCrypt y no en texto plano.

        // Datos de prueba: se prepara la informacion de un nuevo usuario operario.
        RegisterRequestDTO request = new RegisterRequestDTO();
        request.setNombre("Carlos");
        request.setApellido("Diaz");
        request.setEmail("carlos@metroica.pe");
        request.setPassword("segura123");

        // Simulacion: el correo no existe y el servicio JWT devuelve un token de sesion.
        when(usuarioRepository.existsByEmail("carlos@metroica.pe")).thenReturn(false);
        when(jwtUtil.generateToken(any(), any(), any())).thenReturn("jwt-token");

        // Ejecucion: se registra el usuario desde el servicio de autenticacion.
        LoginResponseDTO response = authService.register(request);

        // Validacion: se devuelve token y se guarda password cifrado compatible con BCrypt.
        assertEquals("jwt-token", response.getToken());
        verify(usuarioRepository).save(org.mockito.ArgumentMatchers.argThat(usuario ->
                passwordEncoder.matches("segura123", usuario.getPasswordHash())
                        && usuario.getRol() == RolUsuario.OPERARIO
                        && usuario.getActivo()));
    }

    @Test
    void registerRechazaEmailDuplicado() {
        // Cambios 17/07: Prueba negativa asociada al RF-01 Gestion de usuarios.
        // Evita duplicidad de usuarios usando el correo como dato unico de acceso.

        // Datos de prueba: se intenta registrar un correo que ya pertenece a otro usuario.
        RegisterRequestDTO request = new RegisterRequestDTO();
        request.setEmail("existe@metroica.pe");

        // Simulacion: el repositorio indica que el correo ya existe.
        when(usuarioRepository.existsByEmail("existe@metroica.pe")).thenReturn(true);

        // Ejecucion y validacion: el registro debe ser rechazado con mensaje controlado.
        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.register(request));

        assertTrue(ex.getMessage().contains("Ya existe un usuario"));
    }
}
