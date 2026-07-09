package com.metroica.sgip_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/").permitAll()
                        .requestMatchers("/api/v1/auth/login").permitAll()
                        .requestMatchers("/api/v1/auth/register").hasRole("ADMINISTRADOR")
                        .requestMatchers("/api/v1/inteligencia/datos-entrenamiento").hasAnyRole("ADMINISTRADOR", "GERENTE")
                        .requestMatchers("/api/v1/dashboard/**").hasAnyRole("ADMINISTRADOR", "GERENTE")
                        .requestMatchers("/api/v1/usuarios/**").hasRole("ADMINISTRADOR")
                        .requestMatchers(HttpMethod.GET, "/api/v1/productos/**").hasAnyRole("ADMINISTRADOR", "OPERARIO", "GERENTE")
                        .requestMatchers(HttpMethod.POST, "/api/v1/productos/**").hasRole("ADMINISTRADOR")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/productos/**").hasRole("ADMINISTRADOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/productos/**").hasRole("ADMINISTRADOR")
                        .requestMatchers(HttpMethod.GET, "/api/v1/categorias/**").hasAnyRole("ADMINISTRADOR", "OPERARIO", "GERENTE")
                        .requestMatchers(HttpMethod.GET, "/api/v1/proveedores/**").hasAnyRole("ADMINISTRADOR", "OPERARIO", "GERENTE")
                        .requestMatchers(HttpMethod.POST, "/api/v1/proveedores/**").hasRole("ADMINISTRADOR")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/proveedores/**").hasRole("ADMINISTRADOR")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/proveedores/**").hasRole("ADMINISTRADOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/proveedores/**").hasRole("ADMINISTRADOR")
                        .requestMatchers("/api/v1/movimientos/**").hasAnyRole("ADMINISTRADOR", "OPERARIO")
                        .requestMatchers(HttpMethod.GET, "/api/v1/pedidos/cola").hasAnyRole("ADMINISTRADOR", "OPERARIO", "GERENTE")
                        .requestMatchers("/api/v1/pedidos/**").hasAnyRole("ADMINISTRADOR", "OPERARIO")
                        .requestMatchers(HttpMethod.GET, "/api/v1/alertas/**").hasAnyRole("ADMINISTRADOR", "OPERARIO", "GERENTE")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/alertas/**").hasRole("ADMINISTRADOR")
                        .requestMatchers(HttpMethod.POST, "/api/v1/inteligencia/alertas-predictivas/generar").hasAnyRole("ADMINISTRADOR", "GERENTE")
                        .requestMatchers("/api/v1/inteligencia/predicciones").hasAnyRole("ADMINISTRADOR", "GERENTE")
                        .requestMatchers("/api/v1/reportes/**").hasAnyRole("ADMINISTRADOR", "GERENTE")
                        .requestMatchers("/api/v1/notificaciones/**").hasAnyRole("ADMINISTRADOR", "OPERARIO", "GERENTE")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
