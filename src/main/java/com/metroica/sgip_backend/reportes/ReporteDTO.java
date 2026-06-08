package com.metroica.sgip_backend.reportes;

import java.time.LocalDateTime;
import java.util.UUID;

public class ReporteDTO {
    private UUID id;
    private String tipo;
    private String formato;
    private String parametros;
    private String rutaArchivo;
    private LocalDateTime createdAt;
    private String usuarioEmail;
    private String usuarioNombre;

    public ReporteDTO() {}

    public ReporteDTO(UUID id, String tipo, String formato, String parametros,
                      String rutaArchivo, LocalDateTime createdAt,
                      String usuarioEmail, String usuarioNombre) {
        this.id = id;
        this.tipo = tipo;
        this.formato = formato;
        this.parametros = parametros;
        this.rutaArchivo = rutaArchivo;
        this.createdAt = createdAt;
        this.usuarioEmail = usuarioEmail;
        this.usuarioNombre = usuarioNombre;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getFormato() { return formato; }
    public void setFormato(String formato) { this.formato = formato; }
    public String getParametros() { return parametros; }
    public void setParametros(String parametros) { this.parametros = parametros; }
    public String getRutaArchivo() { return rutaArchivo; }
    public void setRutaArchivo(String rutaArchivo) { this.rutaArchivo = rutaArchivo; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getUsuarioEmail() { return usuarioEmail; }
    public void setUsuarioEmail(String usuarioEmail) { this.usuarioEmail = usuarioEmail; }
    public String getUsuarioNombre() { return usuarioNombre; }
    public void setUsuarioNombre(String usuarioNombre) { this.usuarioNombre = usuarioNombre; }
}