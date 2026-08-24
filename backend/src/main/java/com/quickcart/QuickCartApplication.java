package com.quickcart;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class QuickCartApplication {
    public static void main(String[] args) {
        SpringApplication.run(QuickCartApplication.class, args);
    }
}
