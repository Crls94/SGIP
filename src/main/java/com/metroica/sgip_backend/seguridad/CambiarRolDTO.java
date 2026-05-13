package com.metroica.sgip_backend.seguridad;

import com.metroica.sgip_backend.shared.enums.RolUsuario;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CambiarRolDTO {

    @NotNull(message = "El rol es obligatorio")
    private RolUsuario rol;
}