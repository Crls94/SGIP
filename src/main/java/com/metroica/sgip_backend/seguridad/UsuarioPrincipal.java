package com.metroica.sgip_backend.seguridad;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.UUID;

@Getter
@AllArgsConstructor
public class UsuarioPrincipal {
    private final UUID id;
    private final String email;
    private final String rol;
    private final String nombre;
}
