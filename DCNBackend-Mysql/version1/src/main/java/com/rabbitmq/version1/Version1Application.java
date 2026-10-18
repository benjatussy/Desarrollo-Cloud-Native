package com.rabbitmq.version1;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
@SpringBootApplication
@EnableScheduling  // Para el Circuit Breaker (@Scheduled
public class Version1Application {
	
	public static void main(String[] args) {
		SpringApplication.run(Version1Application.class, args);
	}

}
