// Data+Codable.swift
// Chaos Creatures
// JSON encoding/decoding helpers with Supabase-compatible date formatting.

import Foundation

// MARK: - JSON Decoder for Supabase

extension JSONDecoder {
    /// Configured for Supabase responses (ISO 8601 timestamps with fractional seconds)
    static let supabase: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let string = try container.decode(String.self)

            // Try ISO 8601 with fractional seconds first
            if let date = ISO8601DateFormatter.supabase.date(from: string) {
                return date
            }
            // Try standard ISO 8601
            if let date = ISO8601DateFormatter.standard.date(from: string) {
                return date
            }
            // Try date-only format
            let dateOnly = DateFormatter()
            dateOnly.dateFormat = "yyyy-MM-dd"
            dateOnly.timeZone = TimeZone(identifier: "UTC")
            if let date = dateOnly.date(from: string) {
                return date
            }

            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Cannot decode date from: \(string)"
            )
        }
        return decoder
    }()
}

// MARK: - JSON Encoder for Supabase

extension JSONEncoder {
    /// Configured for Supabase requests (ISO 8601 timestamps)
    static let supabase: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .custom { date, encoder in
            var container = encoder.singleValueContainer()
            try container.encode(ISO8601DateFormatter.supabase.string(from: date))
        }
        return encoder
    }()
}

// MARK: - ISO 8601 Formatters

extension ISO8601DateFormatter {
    /// Supabase uses ISO 8601 with fractional seconds and timezone
    static let supabase: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    static let standard: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()
}

// MARK: - Data Helpers

extension Data {
    /// Decode JSON data to a Codable type using Supabase decoder
    func decoded<T: Decodable>(as type: T.Type = T.self) throws -> T {
        try JSONDecoder.supabase.decode(type, from: self)
    }

    /// Pretty-print JSON data for debugging
    var prettyJSON: String? {
        guard let object = try? JSONSerialization.jsonObject(with: self),
              let data = try? JSONSerialization.data(withJSONObject: object, options: .prettyPrinted),
              let string = String(data: data, encoding: .utf8) else {
            return nil
        }
        return string
    }
}

// MARK: - Encodable Helpers

extension Encodable {
    /// Encode to JSON Data using Supabase encoder
    func jsonData() throws -> Data {
        try JSONEncoder.supabase.encode(self)
    }

    /// Encode to JSON dictionary
    func jsonDictionary() throws -> [String: Any] {
        let data = try jsonData()
        guard let dict = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw EncodingError.invalidValue(self, .init(
                codingPath: [],
                debugDescription: "Failed to convert to dictionary"
            ))
        }
        return dict
    }
}
