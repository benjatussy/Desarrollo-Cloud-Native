package com.shopping_list.items.messaging.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableRabbit
public class RabbitConfig {
    public static final String EVENTS_EXCHANGE = "shopping.events";
    public static final String DEAD_LETTER_EXCHANGE = "shopping.dlx";

    @Bean
    public Declarables shoppingEventTopology() {
        TopicExchange events = new TopicExchange(EVENTS_EXCHANGE, true, false);
        DirectExchange deadLetters = new DirectExchange(DEAD_LETTER_EXCHANGE, true, false);
        Queue userQueue = deadLetterQueue("items.user-events.queue", "items.user-events.dlq");
        Queue categoryQueue = deadLetterQueue("categories.item-events.queue", "categories.item-events.dlq");
        Queue purchasedQueue = deadLetterQueue("users.item-events.queue", "users.item-events.dlq");
        Queue categoryDeletedQueue = deadLetterQueue("items.category-events.queue", "items.category-events.dlq");
        Queue userDlq = QueueBuilder.durable("items.user-events.dlq").build();
        Queue categoryDlq = QueueBuilder.durable("categories.item-events.dlq").build();
        Queue purchasedDlq = QueueBuilder.durable("users.item-events.dlq").build();
        Queue categoryDeletedDlq = QueueBuilder.durable("items.category-events.dlq").build();
        return new Declarables(events, deadLetters,
                userQueue, categoryQueue, purchasedQueue, categoryDeletedQueue,
                userDlq, categoryDlq, purchasedDlq, categoryDeletedDlq,
                BindingBuilder.bind(userQueue).to(events).with("user.*"),
                BindingBuilder.bind(categoryQueue).to(events).with("item.created"),
                BindingBuilder.bind(purchasedQueue).to(events).with("item.purchased"),
                BindingBuilder.bind(categoryDeletedQueue).to(events).with("category.deleted"),
                BindingBuilder.bind(userDlq).to(deadLetters).with("items.user-events.dlq"),
                BindingBuilder.bind(categoryDlq).to(deadLetters).with("categories.item-events.dlq"),
                BindingBuilder.bind(purchasedDlq).to(deadLetters).with("users.item-events.dlq"),
                BindingBuilder.bind(categoryDeletedDlq).to(deadLetters).with("items.category-events.dlq"));
    }

    private Queue deadLetterQueue(String name, String deadLetterRoutingKey) {
        return QueueBuilder.durable(name)
                .withArgument("x-dead-letter-exchange", DEAD_LETTER_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", deadLetterRoutingKey)
                .build();
    }

    @Bean
    public MessageConverter jacksonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
