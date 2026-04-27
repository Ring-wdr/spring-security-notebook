package com.example.springsecuritynotebook.auth.application;

import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import com.example.springsecuritynotebook.subscriber.domain.SubscriberRole;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

public class SubscriberPrincipal extends User {

    private final String email;
    private final String nickname;
    private final boolean social;
    private final List<String> roleNames;

    public SubscriberPrincipal(
            String email,
            String password,
            String nickname,
            boolean social,
            List<String> roleNames
    ) {
        super(email, password, toAuthorities(roleNames));
        this.email = email;
        this.nickname = nickname;
        this.social = social;
        this.roleNames = List.copyOf(roleNames);
    }

    public static SubscriberPrincipal from(Subscriber subscriber) {
        List<String> roleNames = subscriber.getRoleList().stream()
                .map(SubscriberRole::name)
                .toList();

        return new SubscriberPrincipal(
                subscriber.getEmail(),
                subscriber.getPassword(),
                subscriber.getNickname(),
                subscriber.isSocial(),
                roleNames
        );
    }

    public Map<String, Object> getClaims() {
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("email", email);
        claims.put("nickname", nickname);
        claims.put("social", social);
        claims.put("roleNames", roleNames);
        return claims;
    }

    public String getEmail() {
        return email;
    }

    public String getNickname() {
        return nickname;
    }

    public boolean isSocial() {
        return social;
    }

    public List<String> getRoleNames() {
        return roleNames;
    }

    private static Collection<? extends GrantedAuthority> toAuthorities(List<String> roleNames) {
        return roleNames.stream()
                .map(SimpleGrantedAuthority::new)
                .toList();
    }
}
