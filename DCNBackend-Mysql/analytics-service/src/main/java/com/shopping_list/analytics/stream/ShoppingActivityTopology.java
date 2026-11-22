package com.shopping_list.analytics.stream;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping_list.analytics.contract.ShoppingActivityMetric;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.StreamsConfig;
import org.apache.kafka.streams.kstream.Consumed;
import org.apache.kafka.streams.kstream.Grouped;
import org.apache.kafka.streams.kstream.Materialized;
import org.apache.kafka.streams.kstream.Produced;
import org.apache.kafka.streams.kstream.TimeWindows;
import org.apache.kafka.streams.kstream.Windowed;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.KafkaStreamsConfiguration;
import org.springframework.kafka.annotation.EnableKafkaStreams;
import org.springframework.kafka.annotation.KafkaStreamsDefaultConfiguration;
import org.springframework.kafka.support.serializer.JsonSerde;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableKafkaStreams
public class ShoppingActivityTopology {

    private static final int SHARD_COUNT = 16;
    private static final Duration WINDOW_SIZE = Duration.ofHours(1);
    private static final Duration ALLOWED_LATENESS = Duration.ofMinutes(10);
    private static final Duration WINDOW_STATE_RETENTION = Duration.ofDays(7);

    @Bean(name = KafkaStreamsDefaultConfiguration.DEFAULT_STREAMS_CONFIG_BEAN_NAME)
    public KafkaStreamsConfiguration kafkaStreamsConfiguration(
            @Value("${spring.kafka.bootstrap-servers}") String bootstrapServers,
            @Value("${spring.kafka.streams.application-id}") String applicationId) {
        Map<String, Object> properties = new HashMap<>();
        properties.put(StreamsConfig.APPLICATION_ID_CONFIG, applicationId);
        properties.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        properties.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.StringSerde.class);
        properties.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.StringSerde.class);
        properties.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE_V2);
        properties.put(StreamsConfig.REPLICATION_FACTOR_CONFIG, 3);
        properties.put(StreamsConfig.NUM_STANDBY_REPLICAS_CONFIG, 1);
        return new KafkaStreamsConfiguration(properties);
    }

    @Bean
    public org.apache.kafka.streams.kstream.KStream<String, ShoppingActivityParser.ParsedShoppingActivity> shoppingActivityStream(
            org.apache.kafka.streams.StreamsBuilder builder,
            ShoppingActivityParser parser,
            ObjectMapper objectMapper,
            @Value("${app.kafka.topics.shopping-activity-events}") String inputTopic,
            @Value("${app.kafka.topics.shopping-activity-metrics}") String outputTopic,
            @Value("${app.kafka.topics.shopping-activity-events-dlt}") String invalidTopic) {
        var parsed = builder.stream(inputTopic,
                        Consumed.with(Serdes.String(), Serdes.String())
                                .withTimestampExtractor(new EventTimestampExtractor()))
                .mapValues(parser::parse);

        parsed.filter((key, value) -> !value.valid())
                .peek((key, value) -> org.slf4j.LoggerFactory.getLogger(ShoppingActivityTopology.class)
                        .warn("Invalid shopping activity event: key={}, reason={}", key, value.error()))
                .mapValues((key, value) -> value.rawPayload() + "\nInvalid event: " + value.error())
                .to(invalidTopic, Produced.with(Serdes.String(), Serdes.String()));

        var valid = parsed.filter((key, value) -> value.valid())
                .selectKey((key, value) -> metricShardKey(value));
        valid.groupByKey(Grouped.with(Serdes.String(),
                        new JsonSerde<>(ShoppingActivityParser.ParsedShoppingActivity.class, objectMapper)))
                .windowedBy(TimeWindows.ofSizeAndGrace(WINDOW_SIZE, ALLOWED_LATENESS))
                .count(Materialized.<String, Long, org.apache.kafka.streams.state.WindowStore<org.apache.kafka.common.utils.Bytes, byte[]>>
                        as("hourly-shopping-purchases-v1").withRetention(WINDOW_STATE_RETENTION))
                .toStream()
                .map(ShoppingActivityTopology::toMetric)
                .to(outputTopic, Produced.with(Serdes.String(), new JsonSerde<>(ShoppingActivityMetric.class, objectMapper)));

        return valid;
    }

    private static String metricShardKey(ShoppingActivityParser.ParsedShoppingActivity event) {
        int shard = Math.floorMod(event.eventId().hashCode(), SHARD_COUNT);
        return shard + "|purchases";
    }

    private static org.apache.kafka.streams.KeyValue<String, ShoppingActivityMetric> toMetric(
            Windowed<String> windowedKey, Long count) {
        int shard = Integer.parseInt(windowedKey.key().substring(0, windowedKey.key().indexOf('|')));
        return org.apache.kafka.streams.KeyValue.pair(
                windowedKey.window().start() + "|" + shard,
                new ShoppingActivityMetric(java.time.Instant.ofEpochMilli(windowedKey.window().start()), shard, count));
    }
}
