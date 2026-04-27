package com.example.springsecuritynotebook.subscriber.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "subscribers")
@Getter
@Builder
@ToString(exclude = "roleList")
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Subscriber {

  @Id
  @Column(nullable = false, updatable = false, length = 255)
  private String email;

  @Column(nullable = false, length = 200)
  private String password;

  @Column(nullable = false, length = 100)
  private String nickname;

  @Builder.Default
  @Column(nullable = false)
  private boolean social = false;

  @ElementCollection(fetch = FetchType.LAZY)
  @CollectionTable(name = "subscriber_roles", joinColumns = @JoinColumn(name = "subscriber_email"))
  @Enumerated(EnumType.STRING)
  @Column(name = "role_name", nullable = false, length = 50)
  @Builder.Default
  private List<SubscriberRole> roleList = new ArrayList<>();

  public void addRole(SubscriberRole role) {
    if (!roleList.contains(role)) {
      roleList.add(role);
    }
  }

  public void clearRoles() {
    roleList.clear();
  }

  public void changePassword(String password) {
    this.password = password;
  }

  public void changeNickname(String nickname) {
    this.nickname = nickname;
  }
}
