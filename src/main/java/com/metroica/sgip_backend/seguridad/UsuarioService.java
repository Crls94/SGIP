package com.metroica.sgip_backend.seguridad;

import com.metroica.sgip_backend.notificaciones.NotificacionService;
import com.metroica.sgip_backend.shared.enums.RolUsuario;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;

    @Transactional(readOnly = true)
    public List<Usuario> listarUsuarios() {
        return usuarioRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Usuario obtenerPorId(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + id));
    }

    @Transactional
    public void desactivarUsuario(UUID id) {
        Usuario usuario = obtenerPorId(id);
        validarNoEsOperacionSobreSiMismo(id, "No puede desactivar su propia cuenta");
        validarNoEsUltimoAdministrador(usuario);
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
        notificarAdministracion("Usuario desactivado", "Se desactivo la cuenta de " + usuario.getEmail());
    }

    @Transactional
    public Usuario cambiarRol(UUID id, RolUsuario nuevoRol) {
        Usuario usuario = obtenerPorId(id);
        validarNoEsOperacionSobreSiMismo(id, "No puede cambiar su propio rol");
        if (usuario.getRol() == RolUsuario.GERENTE || nuevoRol == RolUsuario.GERENTE) {
            throw new RuntimeException("El rol GERENTE es de supervision y no puede modificarse desde gestion de usuarios");
        }
        if (usuario.getRol() == RolUsuario.ADMINISTRADOR && nuevoRol != RolUsuario.ADMINISTRADOR) {
            validarNoEsUltimoAdministrador(usuario);
        }
        RolUsuario rolAnterior = usuario.getRol();
        usuario.setRol(nuevoRol);
        Usuario guardado = usuarioRepository.save(usuario);
        notificarAdministracion(
                "Rol de usuario actualizado",
                "El usuario " + usuario.getEmail() + " cambio de " + rolAnterior + " a " + nuevoRol);
        return guardado;
    }

    @Transactional
    public Usuario activarUsuario(UUID id) {
        Usuario usuario = obtenerPorId(id);
        usuario.setActivo(true);
        Usuario guardado = usuarioRepository.save(usuario);
        notificarAdministracion("Usuario activado", "Se activo la cuenta de " + usuario.getEmail());
        return guardado;
    }

    private void validarNoEsOperacionSobreSiMismo(UUID id, String mensaje) {
        if (SecurityUtils.getCurrentUserId().equals(id)) {
            throw new RuntimeException(mensaje);
        }
    }

    private void validarNoEsUltimoAdministrador(Usuario usuario) {
        if (usuario.getRol() == RolUsuario.ADMINISTRADOR
                && Boolean.TRUE.equals(usuario.getActivo())
                && usuarioRepository.countByRolAndActivoTrue(RolUsuario.ADMINISTRADOR) <= 1) {
            throw new RuntimeException("Debe existir al menos un administrador activo");
        }
    }

    private void notificarAdministracion(String titulo, String mensaje) {
        List<Usuario> admins = usuarioRepository.findByRolAndActivoTrue(RolUsuario.ADMINISTRADOR);
        for (Usuario admin : admins) {
            notificacionService.crearNotificacion(admin.getId(), titulo, mensaje, "SEGURIDAD", admin.getEmail());
        }
    }
}
