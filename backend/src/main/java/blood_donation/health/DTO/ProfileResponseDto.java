package blood_donation.health.DTO;

import blood_donation.health.Entity.Enum.BloodGroup;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class ProfileResponseDto {
    private Long id;
    private String name;
    private String phone;
    private String city;
    private String district;
    private String state;
    private String email;
    private String village;
    private BloodGroup bloodGroup;
    private LocalDate birthDate;
    private double lat;
    private double lng;
    private boolean available;
    private LocalDate lastDonationDate;
    private LocalDateTime createdAt;
}


//{
//        "donorDashboardData": {
//        "profile": {
//        "id": 1,
//        "name": "Arjun Mehta",
//        "avatar": "AM",
//        "email": "arjun@gmail.com",
//        "phone": "+91 98765 43210",
//        "role": "donor",
//        "bloodGroup": "O+",
//        "location": "Bengaluru, Karnataka",
//        "isAvailable": true,
//        "isVerified": true,
//        "donorSince": "2020",
//        "lastDonationDate": "2025-03-12",
//        "totalDonations": 8,
//        "livesSaved": 24
//        },
//
//        "donationEligibility": {
//        "isEligible": true,
//        "daysSinceLastDonation": 54,
//        "daysUntilEligible": 0,
//        "cooldownDays": 90
//        },
//
//        "nearbyRequests": [
//        {
//        "id": 1,
//        "bloodType": "O+",
//        "hospital": "Manipal Hospital",
//        "location": "Bengaluru",
//        "urgency": "Critical",
//        "postedAt": "2025-05-05T10:00:00Z",
//        "distanceKm": 1.2,
//        "contactPhone": "+91 80 1234 5678"
//        }
//        ],
//
//        "donationHistory": [
//        {
//        "id": 1,
//        "date": "2025-03-12",
//        "hospital": "Manipal Hospital",
//        "bloodGroup": "O+",
//        "units": 1,
//        "status": "Completed",
//        "certificateAvailable": true,
//        "certificateUrl": "https://cdn.bloodconnect.in/certs/don_001.pdf"
//        }
//        ],
//
//        "notifications": [
//        {
//        "id": 1,
//        "type": "urgent",
//        "title": "Critical O+ request near you",
//        "body": "Manipal Hospital needs O+ urgently — 1.2 km away",
//        "isRead": false,
//        "createdAt": "2025-05-05T09:50:00Z"
//        }
//        ],
//
//        "availabilityStatus": {
//        "isAvailable": true,
//        "updatedAt": "2025-05-01T08:00:00Z"
//        }
//        },
//
//        "hospitalDashboardData": {
//        "profile": {
//        "id": 2,
//        "name": "Dr. Priya Sharma",
//        "avatar": "PS",
//        "email": "priya@apollo.in",
//        "phone": "+91 80 2660 4050",
//        "role": "hospital",
//        "hospitalName": "Apollo Hospitals",
//        "location": "Bengaluru, Karnataka",
//        "isVerified": true
//        },
//
//        "dashboardSummary": {
//        "activeRequestsCount": 2,
//        "fulfilledRequestsCount": 2,
//        "totalDonorsInNetwork": 495,
//        "availableDonorsNearby": 9
//        },
//
//        "bloodRequestModule": {
//        "geoDonors": [
//        {
//        "id": 1,
//        "name": "Rahul Das",
//        "bloodGroup": "O+",
//        "lat": 12.9716,
//        "lng": 77.5946,
//        "city": "Bengaluru",
//        "lastDonated": "3 months ago",
//        "isAvailable": true
//        }
//        ],
//        "supportedCities": [
//        {
//        "name": "Bengaluru",
//        "lat": 12.9716,
//        "lng": 77.5946
//        },
//        {
//        "name": "Mysuru",
//        "lat": 12.2958,
//        "lng": 76.6394
//        },
//        {
//        "name": "Hubli",
//        "lat": 15.3647,
//        "lng": 75.124
//        },
//        {
//        "name": "Mangaluru",
//        "lat": 12.9141,
//        "lng": 74.856
//        },
//        {
//        "name": "Tumkur",
//        "lat": 13.3379,
//        "lng": 77.1173
//        }
//        ]
//        },
//
//        "donorSearch": {
//        "availableDonors": [
//        {
//        "id": 1,
//        "name": "Rahul Das",
//        "bloodGroup": "O+",
//        "city": "Bengaluru",
//        "district": "Bengaluru Urban",
//        "state": "Karnataka",
//        "isAvailable": true,
//        "lastDonatedLabel": "3 months ago",
//        "contactPhone": "+91 98000 00001"
//        }
//        ],
//        "filters": {
//        "bloodGroups": ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
//        "states": ["Karnataka", "Maharashtra", "Tamil Nadu", "Telangana", "Kerala"]
//        }
//        },
//
//        "bloodRequests": [
//        {
//        "id": 1,
//        "bloodGroup": "O+",
//        "units": 2,
//        "hospital": "Manipal Hospital",
//        "city": "Bengaluru",
//        "urgency": "Critical",
//        "status": "Pending",
//        "createdAt": "2025-05-05T00:00:00Z"
//        }
//        ],
//
//        "donorStats": {
//        "byCity": [
//        { "city": "Bengaluru", "donorCount": 312 },
//        { "city": "Mysuru",    "donorCount": 87  },
//        { "city": "Hubli",     "donorCount": 64  },
//        { "city": "Mangaluru", "donorCount": 53  },
//        { "city": "Belgaum",   "donorCount": 41  }
//        ],
//        "byBloodGroup": [
//        { "bloodGroup": "O+",  "donorCount": 145, "colorHex": "#ef4444" },
//        { "bloodGroup": "A+",  "donorCount": 112, "colorHex": "#f97316" },
//        { "bloodGroup": "B+",  "donorCount": 89,  "colorHex": "#eab308" },
//        { "bloodGroup": "AB+", "donorCount": 56,  "colorHex": "#22c55e" },
//        { "bloodGroup": "O-",  "donorCount": 34,  "colorHex": "#06b6d4" },
//        { "bloodGroup": "A-",  "donorCount": 28,  "colorHex": "#8b5cf6" },
//        { "bloodGroup": "B-",  "donorCount": 19,  "colorHex": "#ec4899" },
//        { "bloodGroup": "AB-", "donorCount": 12,  "colorHex": "#64748b" }
//        ],
//        "totalDonors": 495
//        },
//
//        "notifications": [
//        {
//        "id": 1,
//        "type": "urgent",
//        "title": "Critical O+ request near you",
//        "body": "Manipal Hospital needs O+ urgently — 1.2 km away",
//        "isRead": false,
//        "createdAt": "2025-05-05T09:50:00Z"
//        }
//        ]
//        }
//        }