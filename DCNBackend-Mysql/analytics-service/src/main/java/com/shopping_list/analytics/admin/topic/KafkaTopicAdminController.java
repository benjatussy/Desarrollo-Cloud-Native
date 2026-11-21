package com.shopping_list.analytics.admin.topic;

import com.shopping_list.analytics.admin.OperationConfirmation;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/kafka/topics")
public class KafkaTopicAdminController {

    private final KafkaTopicAdminService topicAdminService;

    public KafkaTopicAdminController(KafkaTopicAdminService topicAdminService) {
        this.topicAdminService = topicAdminService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SCOPE_Kafka.Read')")
    public List<String> listTopics() {
        return topicAdminService.listTopics();
    }

    @GetMapping("/{topic}")
    @PreAuthorize("hasAuthority('SCOPE_Kafka.Read')")
    public TopicDetails describeTopic(@PathVariable String topic) {
        return topicAdminService.describeTopic(topic);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SCOPE_Kafka.Admin')")
    @ResponseStatus(HttpStatus.CREATED)
    public void createTopic(@Valid @RequestBody TopicCreateRequest request, @AuthenticationPrincipal Jwt caller) {
        topicAdminService.createTopic(request, caller.getSubject());
    }

    @PutMapping("/{topic}/config")
    @PreAuthorize("hasAuthority('SCOPE_Kafka.Admin')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateTopicConfig(@PathVariable String topic,
                                  @Valid @RequestBody TopicConfigUpdateRequest request,
                                  @AuthenticationPrincipal Jwt caller) {
        topicAdminService.updateTopicConfig(topic, request, caller.getSubject());
    }

    @DeleteMapping("/{topic}")
    @PreAuthorize("hasAuthority('SCOPE_Kafka.Admin')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTopic(@PathVariable String topic,
                            @Valid @RequestBody OperationConfirmation request,
                            @AuthenticationPrincipal Jwt caller) {
        topicAdminService.deleteTopic(topic, request.confirmation(), caller.getSubject());
    }
}
