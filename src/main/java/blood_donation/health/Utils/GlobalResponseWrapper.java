package blood_donation.health.Utils;

import blood_donation.health.DTO.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

@RestControllerAdvice
public class GlobalResponseWrapper implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType,
                            Class<? extends HttpMessageConverter<?>> converterType) {
        return !returnType.getParameterType().equals(ApiResponse.class)
                && !returnType.getParameterType().equals(ErrorResponse.class)
                && !returnType.getParameterType().equals(ResponseEntity.class);
    }

    @Override
    public Object beforeBodyWrite(Object body,
                                  MethodParameter returnType,
                                  MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  ServerHttpRequest request,
                                  ServerHttpResponse response) {

        // Skip error responses written directly (from GlobalExceptionHandler)
        if (body instanceof ErrorResponse) {
            return body;
        }

        // Resolve HTTP status from the actual response
        int status = 200;
        if (response instanceof ServletServerHttpResponse servletResponse) {
            status = servletResponse.getServletResponse().getStatus();
        }

        // String return types need special handling (can't wrap directly)
        if (body instanceof String) {
            try {
                ApiResponse<String> wrapped = new ApiResponse<>(status, true, (String) body, null);
                response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
                return new ObjectMapper()
                        .findAndRegisterModules()   // handles LocalDateTime
                        .writeValueAsString(wrapped);
            } catch (Exception e) {
                return body;
            }
        }

        return new ApiResponse<>(status, true, "Success", body);
    }
}