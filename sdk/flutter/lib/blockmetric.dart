import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';

class Blockmetric {
  static Blockmetric? _instance;
  final String apiKey;
  final String apiUrl;
  String? _sessionId;
  Map<String, dynamic>? _deviceInfo;
  PackageInfo? _packageInfo;

  Blockmetric._({required this.apiKey, required this.apiUrl});

  static Future<Blockmetric> initialize({
    required String apiKey,
    String apiUrl = 'https://api.blockmetric.io',
  }) async {
    if (_instance == null) {
      _instance = Blockmetric._(apiKey: apiKey, apiUrl: apiUrl);
      await _instance!._initializeSession();
    }
    return _instance!;
  }

  Future<void> _initializeSession() async {
    final prefs = await SharedPreferences.getInstance();
    _sessionId = prefs.getString('blockmetric_session_id');

    if (_sessionId == null) {
      _sessionId = DateTime.now().millisecondsSinceEpoch.toString();
      await prefs.setString('blockmetric_session_id', _sessionId!);
    }

    await _initializeDeviceInfo();
    await _initializePackageInfo();
  }

  Future<void> _initializeDeviceInfo() async {
    final deviceInfo = DeviceInfoPlugin();
    if (await deviceInfo.androidInfo != null) {
      final androidInfo = await deviceInfo.androidInfo;
      _deviceInfo = {
        'platform': 'android',
        'model': androidInfo.model,
        'manufacturer': androidInfo.manufacturer,
        'version': androidInfo.version.release,
      };
    } else if (await deviceInfo.iosInfo != null) {
      final iosInfo = await deviceInfo.iosInfo;
      _deviceInfo = {
        'platform': 'ios',
        'model': iosInfo.model,
        'version': iosInfo.systemVersion,
      };
    }
  }

  Future<void> _initializePackageInfo() async {
    _packageInfo = await PackageInfo.fromPlatform();
  }

  Future<void> trackEvent(String eventName, [Map<String, dynamic>? properties]) async {
    final eventData = {
      'event': eventName,
      'timestamp': DateTime.now().toIso8601String(),
      'session_id': _sessionId,
      'device': _deviceInfo,
      'app': {
        'package_name': _packageInfo?.packageName,
        'version': _packageInfo?.version,
        'build_number': _packageInfo?.buildNumber,
      },
      'properties': properties ?? {},
    };

    try {
      final response = await http.post(
        Uri.parse('$apiUrl/track'),
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'x-app-identifier': _packageInfo?.packageName ?? '',
        },
        body: json.encode(eventData),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to track event: ${response.body}');
      }
    } catch (e) {
      print('Error tracking event: $e');
      // TODO: Implement offline event queue
    }
  }

  Future<void> trackScreenView(String screenName) async {
    await trackEvent('screen_view', {'screen_name': screenName});
  }

  Future<void> trackUserAction(String action, [Map<String, dynamic>? properties]) async {
    final actionProperties = {
      'action': action,
      ...?properties,
    };
    await trackEvent('user_action', actionProperties);
  }
}