CREATE TABLE IF NOT EXISTS hourly_shopping_metrics (
    bucket_key VARCHAR(80) NOT NULL,
    window_start TIMESTAMP(3) NOT NULL,
    shard SMALLINT NOT NULL,
    purchase_count BIGINT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (bucket_key),
    UNIQUE KEY uq_hourly_shopping_metrics_window_shard (window_start, shard),
    CONSTRAINT chk_hourly_shopping_metrics_count CHECK (purchase_count > 0),
    CONSTRAINT chk_hourly_shopping_metrics_shard CHECK (shard >= 0)
);
