package com.shopping_list.analytics.api;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kafka/metrics")
public class ShoppingMetricsQueryController {

    private final JdbcTemplate jdbcTemplate;

    public ShoppingMetricsQueryController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public record HourlyMetricResponse(Instant windowStart, long totalPurchases, int activeShards) {}

    /**
     * Retorna las métricas de compras agregadas por hora calculadas por Kafka Streams.
     */
    @GetMapping("/hourly")
    public List<HourlyMetricResponse> getHourlyMetrics() {
        String sql = """
                SELECT window_start, SUM(purchase_count) as total_purchases, COUNT(DISTINCT shard) as active_shards
                FROM hourly_shopping_metrics
                GROUP BY window_start
                ORDER BY window_start DESC
                LIMIT 24
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new HourlyMetricResponse(
                rs.getTimestamp("window_start").toInstant(),
                rs.getLong("total_purchases"),
                rs.getInt("active_shards")
        ));
    }

    /**
     * Resumen acumulado de eventos procesados a través del pipeline de Kafka.
     */
    @GetMapping("/summary")
    public Map<String, Object> getSummary() {
        String sql = """
                SELECT COALESCE(SUM(purchase_count), 0) as total_events,
                       COUNT(DISTINCT window_start) as total_windows
                FROM hourly_shopping_metrics
                """;
        return jdbcTemplate.queryForMap(sql);
    }
}
