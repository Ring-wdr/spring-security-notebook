package com.example.springsecuritynotebook.architecture;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class FeaturePackageStructureTests {

  @Test
  void domainAndPersistenceTypesAreOwnedByFeatures() {
    assertPackage("com.example.springsecuritynotebook.subscriber.domain.Subscriber");
    assertPackage("com.example.springsecuritynotebook.subscriber.domain.SubscriberRole");
    assertPackage("com.example.springsecuritynotebook.subscriber.persistence.SubscriberRepository");
    assertPackage("com.example.springsecuritynotebook.content.domain.Content");
    assertPackage("com.example.springsecuritynotebook.content.persistence.ContentRepository");
  }

  @Test
  void globalPersistencePackageDoesNotOwnFeatureTypes() {
    assertClassMissing("com.example.springsecuritynotebook.persistence.entity.Subscriber");
    assertClassMissing("com.example.springsecuritynotebook.persistence.entity.Content");
    assertClassMissing("com.example.springsecuritynotebook.persistence.model.SubscriberRole");
    assertClassMissing(
        "com.example.springsecuritynotebook.persistence.repository.SubscriberRepository");
    assertClassMissing(
        "com.example.springsecuritynotebook.persistence.repository.ContentRepository");
  }

  private void assertPackage(String className) {
    Class<?> type = assertDoesNotThrow(() -> Class.forName(className));

    assertEquals(packageName(className), type.getPackageName());
  }

  private void assertClassMissing(String className) {
    assertThrows(ClassNotFoundException.class, () -> Class.forName(className));
  }

  private String packageName(String className) {
    return className.substring(0, className.lastIndexOf('.'));
  }
}
