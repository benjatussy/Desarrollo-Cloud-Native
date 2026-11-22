package com.shopping_list.analytics.stream;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.streams.processor.TimestampExtractor;

import java.time.Instant;
import java.time.format.DateTimeParseException;

public class EventTimestampExtractor implements TimestampExtractor {

    @Override
    public long extract(ConsumerRecord<Object, Object> record, long partitionTime) {
        if (!(record.value() instanceof String payload)) {
            return record.timestamp();
        }
        try {
            int fieldStart = payload.indexOf("\"occurredAt\"");
            if (fieldStart < 0) {
                return record.timestamp();
            }
            int separator = payload.indexOf(':', fieldStart);
            if (separator < 0) {
                return record.timestamp();
            }
            int valueStart = payload.indexOf('"', separator + 1);
            int valueEnd = payload.indexOf('"', valueStart + 1);
            if (fieldStart < 0 || valueStart < 0 || valueEnd < 0) {
                return record.timestamp();
            }
            return Instant.parse(payload.substring(valueStart + 1, valueEnd)).toEpochMilli();
        } catch (DateTimeParseException | IndexOutOfBoundsException exception) {
            return record.timestamp();
        }
    }
}
