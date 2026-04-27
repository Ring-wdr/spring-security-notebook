package com.example.springsecuritynotebook.auth.application;

import com.example.springsecuritynotebook.shared.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final JwtProperties jwtProperties;
    private final SecretKey signingKey;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.signingKey = Keys.hmacShaKeyFor(jwtProperties.secret().getBytes(StandardCharsets.UTF_8));
    }

    public TokenPairResponse generateTokenPair(SubscriberPrincipal principal) {
        long accessTokenExpiresIn = jwtProperties.accessTokenMinutes() * 60L;
        long refreshTokenExpiresIn = jwtProperties.refreshTokenMinutes() * 60L;

        String accessToken = generateToken(principal.getClaims(), accessTokenExpiresIn);
        String refreshToken = generateToken(Map.of("email", principal.getEmail()), refreshTokenExpiresIn);

        return new TokenPairResponse(
                "Bearer",
                accessToken,
                refreshToken,
                accessTokenExpiresIn,
                refreshTokenExpiresIn
        );
    }

    public Map<String, Object> validateToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        Map<String, Object> result = new LinkedHashMap<>(claims);
        result.remove("exp");
        result.remove("iat");
        result.remove("iss");
        return result;
    }

    private String generateToken(Map<String, Object> claims, long expiresInSeconds) {
        Instant now = Instant.now();
        Instant expiration = now.plusSeconds(expiresInSeconds);

        return Jwts.builder()
                .issuer(jwtProperties.issuer())
                .claims(new LinkedHashMap<>(claims))
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .signWith(signingKey)
                .compact();
    }
}
