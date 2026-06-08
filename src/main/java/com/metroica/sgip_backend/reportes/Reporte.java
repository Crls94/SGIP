package com.metroica.sgip_backend.reportes;

import com.metroica.sgip_backend.seguridad.Usuario;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reportes")
@Data
public class Reporte {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 80)
    private String tipo;

    @Column(nullable = false, length = 10)
    private String formato;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String parametros;

    @Column(name = "ruta_archivo", columnDefinition = "text")
    private String rutaArchivo;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
