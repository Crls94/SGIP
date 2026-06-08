package com.metroica.sgip_backend.inteligencia;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PrediccionRepository extends JpaRepository<PrediccionDemanda, UUID> {

    @Query("SELECT p FROM PrediccionDemanda p JOIN FETCH p.producto ORDER BY p.semanaInicio DESC")
    List<PrediccionDemanda> findUltimasPredicciones();

    @EntityGraph(attributePaths = "producto")
    Optional<PrediccionDemanda> findFirstByOrderByGeneradoEnDesc();
}
