package com.shopping_list.analytics.admin.group;

import com.shopping_list.analytics.admin.OperationConfirmation;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/kafka/consumer-groups")
public class KafkaConsumerGroupAdminController {

    private final KafkaConsumerGroupAdminService groupAdminService;

    public KafkaConsumerGroupAdminController(KafkaConsumerGroupAdminService groupAdminService) {
        this.groupAdminService = groupAdminService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SCOPE_Kafka.Read')")
    public List<ConsumerGroupSummary> listGroups() {
        return groupAdminService.listGroups();
    }

    @GetMapping("/{groupId}")
    @PreAuthorize("hasAuthority('SCOPE_Kafka.Read')")
    public ConsumerGroupDetails describeGroup(@PathVariable String groupId) {
        return groupAdminService.describeGroup(groupId);
    }

    @DeleteMapping("/{groupId}")
    @PreAuthorize("hasAuthority('SCOPE_Kafka.Admin')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGroup(@PathVariable String groupId,
                            @Valid @RequestBody OperationConfirmation request,
                            @AuthenticationPrincipal Jwt caller) {
        groupAdminService.deleteInactiveGroup(groupId, request.confirmation(), caller.getSubject());
    }
}
