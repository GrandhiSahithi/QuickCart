package com.quickcart.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "stores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Vertical vertical;

    private String imageUrl;

    @Column(nullable = false)
    private Double rating = 4.5;

    @Column(nullable = false)
    private Integer etaMinutes = 30;

    @Column(nullable = false)
    private Double lat;

    @Column(nullable = false)
    private Double lng;
}
